import { usePlayerStore } from '../../store/playerStore';
import Player from './Player';

/**
 * 球员层：渲染所有球员（按主队/客队显隐过滤）
 */
function PlayerLayer() {
    const players = usePlayerStore(s => s.players);
    const showHome = usePlayerStore(s => s.showHome);
    const showAway = usePlayerStore(s => s.showAway);

    const visiblePlayers = players.filter(p =>
        p.team === 'home' ? showHome : showAway,
    );

    return (
        <>
            {visiblePlayers.map(player => (
                <Player key={player.id} player={player} />
            ))}
        </>
    );
}

export default PlayerLayer;
