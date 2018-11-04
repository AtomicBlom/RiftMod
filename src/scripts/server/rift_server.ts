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
        if (eventData.entity.__identifier__ !== "rift:rift") return;

        //Create Pair
        const nameable = system.getComponent(eventData.entity, MinecraftComponent.Nameable);
        nameable.allowNameTagRenaming = false;
        try {
            if (!nameable.name) {
                //Either this is a 
            }
            JSON.parse(nameable.name);
        } catch (e) {
            system.broadcastEvent(BroadcastableServerEvent.DisplayChat, "Could not parse name...");
        }

    }
}