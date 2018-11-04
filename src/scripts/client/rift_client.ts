import { Events } from "../definitions";

namespace Client {
    const system = client.registerSystem(0, 0);

    let player: IEntityObject;

    system.initialize = function() {
        system.listenForEvent(MinecraftClientEvent.ClientEnteredWorld, onPlayerEnterWorld);
        system.listenForEvent(Events.TeleportClient, teleportPlayer);
    }

    function teleportPlayer(position: IPositionComponent & IEntityObject) {

        //TODO: Verify player is correct
        const playerPosition = system.getComponent(player, MinecraftComponent.Position);
        if (playerPosition == null) return;
        playerPosition.x = position.x
        playerPosition.y = position.y
        playerPosition.z = position.z
        system.applyComponentChanges(playerPosition);
    }

    function onPlayerEnterWorld(playerId: EntityId) {
        player = <IEntityObject><any>playerId;
        system.broadcastEvent(Events.AnnounceClient, playerId);
        system.broadcastEvent(BroadcastableClientEvent.DisplayChat, "player has entered game");

    }


}