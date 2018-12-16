/// <reference types="minecraft-scripting-types-client" />

import { Events } from "../definitions";

namespace Client {
    const system = client.registerSystem(0, 0);

    system.initialize = function() {
        system.listenForEvent(ReceiveFromMinecraftClient.ClientEnteredWorld, onPlayerEnterWorld)
    }

    function onPlayerEnterWorld(playerId: EntityId) {
        system.broadcastEvent(Events.AnnounceClient, playerId);
    }
}