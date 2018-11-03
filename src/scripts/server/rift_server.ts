import { Events } from "../definitions";

namespace Server {
    const system = server.registerSystem(0, 0);

    const players: IEntityObject[] = [];

    system.initialize = function() {
        this.listenForEvent(Events.AnnounceClient, announceClient);
        this.listenForEvent(MinecraftServerEvent.EntityCreated, entityCreated);
    }

    function announceClient(player: IEntityObject) {
        players.push(player);
    }

    function entityCreated(eventData: IEntityCreatedEventData) {
        //system.broadcastEvent(BroadcastableServerEvent.DisplayChat, eventData.entity.__identifier__);        
    }
}