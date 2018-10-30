import { Events } from "../definitions";

namespace Server {
    const system = server.registerSystem(0, 0);

    const players: EntityId[] = [];

    system.initialize = function() {
        this.listenForEvent(Events.AnnounceClient, (clientId: EntityId) => {
            players.push(clientId);
        })
    }
}