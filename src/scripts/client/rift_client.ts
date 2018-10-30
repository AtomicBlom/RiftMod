import { Events } from "../definitions";

namespace Client {
    const system = client.registerSystem(0, 0);

    system.initialize = function() {
        this.listenForEvent(MinecraftClientEvent.ClientEnteredWorld, onPlayerEnterWorld);
    }

    function onPlayerEnterWorld(playerId: EntityId) {
        system.broadcastEvent(Events.AnnounceClient, playerId);
        system.broadcastEvent(BroadcastableClientEvent.DisplayChat, "player has entered game");
    }


}