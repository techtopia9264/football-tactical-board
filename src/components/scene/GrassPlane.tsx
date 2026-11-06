import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three-stdlib';
import { PITCH_LENGTH, PITCH_WIDTH, PITCH_MARGIN } from '../../config/pitchConfig';
import {
    VERT_COMMON_INJECT,
    VERT_WORLDPOS_INJECT,
    FRAG_COMMON_INJECT,
    buildColorInject,
    FRAG_NORMAL_INJECT_V1,
    FRAG_NORMAL_INJECT_V2,
    SOIL_COMMON_INJECT,
    SOIL_COLOR_INJECT,
    SOIL_NORMAL_INJECT,
} from '../../shaders/grass-injection';
import { useGrassStore } from '../../store/grassStore';

/** 各渲染版本的条纹调制系数 */
const STRIPE_MOD: Record<'v1' | 'v2', number> = { v1: 0.5, v2: 1.5 };

/** 草皮板厚度（实体高度） */
const GRASS_THICKNESS = 0.15;
/** 草皮板边缘圆角半径 */
const GRASS_CORNER_RADIUS = 0.05;
/** 侧面底部土色 */
const SOIL_COLOR = '#6b4f2e';
/** 侧面顶部草根色（与草皮边缘色一致） */
const ROOT_COLOR = '#3e5a1f';

/**
 * 草皮：圆角实体板（RoundedBoxGeometry）——顶面为程序化草皮材质，
 * 四周侧面为深色断面，边缘平滑圆角，类似"球场板子"。
 * 顶面材质通过 onBeforeCompile 注入多频率噪声着色与法线扰动。
 */
function GrassPlane() {
    const params = useGrassStore(s => s.params);
    const visible = useGrassStore(s => s.visible);

    // 最新参数引用：onBeforeCompile 重编译时用最新值初始化 uniforms
    const paramsRef = useRef(params);
    paramsRef.current = params;

    const grassMaterial = useMemo(() => {
        const mat = new THREE.MeshStandardMaterial({
            color: '#ffffff',
            roughness: 0.85,
            metalness: 0,
        });

        mat.onBeforeCompile = shader => {
            const p = paramsRef.current;

            // uniforms（初值来自最新参数，参数变化由下方 useEffect 同步）
            shader.uniforms.uColorCenter = { value: new THREE.Color(p.colorCenter) };
            shader.uniforms.uColorEdge = { value: new THREE.Color(p.colorEdge) };
            shader.uniforms.uEdgeStrength = { value: p.edgeStrength };
            shader.uniforms.uStripeEnabled = { value: p.stripeEnabled ? 1 : 0 };
            shader.uniforms.uStripeFreq = { value: p.stripeFreq };
            shader.uniforms.uStripeStrength = { value: p.stripeStrength };
            shader.uniforms.uNoiseStrength = { value: p.noiseStrength };
            shader.uniforms.uBladeStrength = { value: p.bladeStrength };
            shader.uniforms.uBumpStrength = { value: p.bumpStrength };
            shader.uniforms.uYellowing = { value: p.yellowing };

            // 顶点着色器注入：传递世界坐标（纹理不随场地缩放/平移拉伸）
            shader.vertexShader = shader.vertexShader.replace(
                '#include <common>',
                `#include <common>\n${VERT_COMMON_INJECT}`,
            );
            shader.vertexShader = shader.vertexShader.replace(
                '#include <project_vertex>',
                VERT_WORLDPOS_INJECT,
            );

            // 片段着色器注入：噪声函数 + 着色（按渲染版本选择公式）+ 法线扰动
            shader.fragmentShader = shader.fragmentShader.replace(
                '#include <common>',
                `#include <common>\n${FRAG_COMMON_INJECT}`,
            );
            shader.fragmentShader = shader.fragmentShader.replace(
                '#include <color_fragment>',
                buildColorInject(STRIPE_MOD[p.effectStyle]),
            );
            shader.fragmentShader = shader.fragmentShader.replace(
                '#include <normal_fragment_maps>',
                p.effectStyle === 'v2'
                    ? FRAG_NORMAL_INJECT_V2
                    : FRAG_NORMAL_INJECT_V1,
            );

            mat.userData.shader = shader;
        };

        return mat;
    }, []);

    // 渲染版本切换 → 标记重编译（onBeforeCompile 会按最新 effectStyle 注入公式）
    useEffect(() => {
        grassMaterial.needsUpdate = true;
    }, [grassMaterial, params.effectStyle]);

    // 参数变化 → 同步 uniforms（无需重建材质）
    useEffect(() => {
        const shader = matShader(grassMaterial);
        if (!shader) return;
        const u = shader.uniforms;
        (u.uColorCenter.value as THREE.Color).set(params.colorCenter);
        (u.uColorEdge.value as THREE.Color).set(params.colorEdge);
        u.uEdgeStrength.value = params.edgeStrength;
        u.uStripeEnabled.value = params.stripeEnabled ? 1 : 0;
        u.uStripeFreq.value = params.stripeFreq;
        u.uStripeStrength.value = params.stripeStrength;
        u.uNoiseStrength.value = params.noiseStrength;
        u.uBladeStrength.value = params.bladeStrength;
        u.uBumpStrength.value = params.bumpStrength;
        u.uYellowing.value = params.yellowing;
    }, [params, grassMaterial]);

    useEffect(() => {
        return () => grassMaterial.dispose();
    }, [grassMaterial]);

    // 侧面材质（土壤剖面：顶部草根绿 → 底部土色 + 噪点 + 法线扰动）
    const sideMaterial = useMemo(() => {
        const mat = new THREE.MeshStandardMaterial({
            color: '#ffffff',
            roughness: 0.9,
        });

        mat.onBeforeCompile = shader => {
            shader.uniforms.uSoilColor = { value: new THREE.Color(SOIL_COLOR) };
            shader.uniforms.uRootColor = { value: new THREE.Color(ROOT_COLOR) };

            shader.vertexShader = shader.vertexShader.replace(
                '#include <common>',
                `#include <common>\n${VERT_COMMON_INJECT}`,
            );
            shader.vertexShader = shader.vertexShader.replace(
                '#include <project_vertex>',
                VERT_WORLDPOS_INJECT,
            );

            shader.fragmentShader = shader.fragmentShader.replace(
                '#include <common>',
                `#include <common>\n${SOIL_COMMON_INJECT}`,
            );
            shader.fragmentShader = shader.fragmentShader.replace(
                '#include <color_fragment>',
                SOIL_COLOR_INJECT,
            );
            shader.fragmentShader = shader.fragmentShader.replace(
                '#include <normal_fragment_maps>',
                SOIL_NORMAL_INJECT,
            );
        };

        return mat;
    }, []);

    const width = PITCH_LENGTH + PITCH_MARGIN * 2;
    const depth = PITCH_WIDTH + PITCH_MARGIN * 2;

    // 圆角盒体几何（顶面 y=0 需把 mesh 下移半个厚度）
    const geometry = useMemo(
        () => new RoundedBoxGeometry(width, GRASS_THICKNESS, depth, 4, GRASS_CORNER_RADIUS),
        [width, depth],
    );

    useEffect(() => {
        return () => geometry.dispose();
    }, [geometry]);

    // 图层显隐（放在所有 hooks 之后，保持 hooks 顺序）
    if (!visible) return null;

    return (
        <mesh geometry={geometry} position={[0, -GRASS_THICKNESS / 2, 0]} receiveShadow>
            {/* 多材质：RoundedBoxGeometry 分组 +x,-x,+y,-y,+z,-z，顶面(index 2)为草皮材质 */}
            <primitive object={sideMaterial} attach="material-0" />
            <primitive object={sideMaterial} attach="material-1" />
            <primitive object={grassMaterial} attach="material-2" />
            <primitive object={sideMaterial} attach="material-3" />
            <primitive object={sideMaterial} attach="material-4" />
            <primitive object={sideMaterial} attach="material-5" />
        </mesh>
    );
}

/** 从材质 userData 取编译后的 shader（onBeforeCompile 未触发时为 null） */
function matShader(material: THREE.MeshStandardMaterial) {
    const shader = material.userData.shader as
        | { uniforms: Record<string, { value: unknown }> }
        | undefined;
    return shader ?? null;
}

export default GrassPlane;
