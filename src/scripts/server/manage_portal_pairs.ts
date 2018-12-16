/// <reference types="minecraft-scripting-types-server" />

//FIXME: Explode pairs when one of the others dies.
//FIXME: Randomize locations
//FIXME: Teleport players
//DONE?: Teleport Items
//FIXME: Portals should only spawn in overworld
//FIXME: Players cannot spawn in rifts in other dimensions manually.
//FIXME: Items must be at least X ticks old to spawn.
//FIXME: Portals should not move after they have settled
//FIXME: Portals should be invisible until they have settled


import { 
    Events, 
    Components, 
    Entity, 
    RiftState, 
    RiftStateComponent, 
    RiftRole 
} from "../definitions";

namespace ManagePortalPairs {
    const system = server.registerSystem(0, 0);

    const players: IEntityObject[] = [];
    let currentTick = 0;
    let lastEntityCheckTick = 0;
    let checkEntitiesThisTick: boolean = false;

    let spatialView: IQuery;

    system.initialize = function() {

        const exampleRiftStateComponent: Partial<RiftStateComponent> = {
            partnerLocation: [0, 0, 0],
            lastLocation: [0, 0, 0],
            state: RiftState.Settling,
            role: RiftRole.Primary
        }
        this.registerComponent(Components.RiftState, exampleRiftStateComponent);

        this.listenForEvent(Events.AnnounceClient, announceClient);
        this.listenForEvent(ReceiveFromMinecraftServer.EntityCreated, entityCreated);
        this.listenForEvent(ReceiveFromMinecraftServer.EntityTick, entityTick);

        spatialView = this.registerQuery(MinecraftComponent.Position, "x", "y", "z");
    }

    
    system.update = function() {
        currentTick++;
        if (lastEntityCheckTick < currentTick - 20) {
            checkEntitiesThisTick = true;
            lastEntityCheckTick = currentTick;
        } else {
            checkEntitiesThisTick = false;
        }
    }

    function announceClient(player: IEntityObject) {
        players.push(player);
    }

    function entityTick(entityData: IEntityTickEventData) {
        const entity = entityData.entity;
        if (!checkEntitiesThisTick || entity.__identifier__ !== "rift:rift") return;
        const rift = entity;
        let riftStateComponent = system.getComponent<RiftStateComponent>(rift, Components.RiftState);

        switch (riftStateComponent.state) {
            case RiftState.Ready:
                return;
            case RiftState.Settling:
                checkRiftSettling(rift, riftStateComponent);
                applyRiftComponentSettings(rift, riftStateComponent);
                return;
        }
    }

    function checkRiftSettling(rift: IEntityObject, riftStateComponent: RiftStateComponent) {
        const position = system.getComponent(rift, MinecraftComponent.Position);

        if (!!riftStateComponent.lastLocation && (
                Math.floor(riftStateComponent.lastLocation[0]) === Math.floor(position.x) &&
                Math.floor(riftStateComponent.lastLocation[1]) === Math.floor(position.y) &&
                Math.floor(riftStateComponent.lastLocation[2]) === Math.floor(position.z))) {
            onRiftSettled(rift, riftStateComponent);
        } else {
            riftStateComponent.lastLocation = [position.x, position.y, position.z];
        }
    }

    function applyRiftComponentSettings(rift: IEntityObject, riftStateComponent: RiftStateComponent) {
        const nameable = system.getComponent(rift, MinecraftComponent.Nameable);
        nameable.allowNameTagRenaming = false;

        const stateCopy: Partial<RiftStateComponent> = {
            role: riftStateComponent.role,
            state: riftStateComponent.state
        };
        if (!!riftStateComponent.partnerLocation) {
            stateCopy.partnerLocation = riftStateComponent.partnerLocation;
        }

        nameable.name = JSON.stringify(stateCopy);
        system.applyComponentChanges(rift, riftStateComponent);
        system.applyComponentChanges(rift, nameable);

        displayRiftState(rift, riftStateComponent);
    }

    function displayRiftState(rift: IEntityObject, riftStateComponent: RiftStateComponent) {
        system.broadcastEvent(SendToMinecraftServer.DisplayChat, `Rift has updated: ${rift.id}:  ${riftStateComponent.role}, ${riftStateComponent.state}, ${JSON.stringify(riftStateComponent.lastLocation)}, ${JSON.stringify(riftStateComponent.partnerLocation)}`);
    }

    function onRiftSettled(rift: IEntityObject, riftStateComponent: RiftStateComponent) {
        const riftPosition = system.getComponent(rift, MinecraftComponent.Position);
        // Rift Rolled?
        if (riftStateComponent.role === RiftRole.Primary) {
            riftStateComponent.state = RiftState.WaitingForPartnerToSettle;
            //Never gonna give you up.           

            const secondaryRift = system.createEntity(EntityType.Entity, Entity.Rift);
            const secondaryRiftPosition = system.getComponent(secondaryRift, MinecraftComponent.Position);
            const secondaryRiftState = system.createComponent<RiftStateComponent>(secondaryRift, Components.RiftState);
            
            secondaryRiftState.role = RiftRole.Secondary;
            secondaryRiftState.state = RiftState.Settling;
            secondaryRiftState.partnerLocation = [
                Math.floor(riftPosition.x),
                Math.floor(riftPosition.y),
                Math.floor(riftPosition.z)
            ]

            secondaryRiftPosition.x = riftPosition.x + 20;
            secondaryRiftPosition.y = 256
            secondaryRiftPosition.z = riftPosition.z + 20;
            system.applyComponentChanges(secondaryRift, secondaryRiftPosition);
            applyRiftComponentSettings(secondaryRift, secondaryRiftState);
        } else {
            //Never gonna let you go.
            system.broadcastEvent(SendToMinecraftServer.DisplayChat, "Secondary node has settled");
            const entities = system.getEntitiesFromQuery(spatialView, 
                riftStateComponent.partnerLocation[0] - 1,
                riftStateComponent.partnerLocation[1] - 1,
                riftStateComponent.partnerLocation[2] - 1,
                riftStateComponent.partnerLocation[0] + 1,
                riftStateComponent.partnerLocation[1] + 1,
                riftStateComponent.partnerLocation[2] + 1
            );

            for (const entity of entities) {
                system.broadcastEvent(SendToMinecraftServer.DisplayChat, `found entity: ${JSON.stringify(entity)}`);

                if (entity.__identifier__ === Entity.Rift) {
                    const primaryRift = entity;
                    const primaryRiftState = system.getComponent<RiftStateComponent>(primaryRift, Components.RiftState);
                    primaryRiftState.state = RiftState.Ready;
                    primaryRiftState.partnerLocation = [
                        Math.floor(riftPosition.x),
                        Math.floor(riftPosition.y),
                        Math.floor(riftPosition.z)
                    ]
                    applyRiftComponentSettings(primaryRift, primaryRiftState);
                }
            }

            riftStateComponent.state = RiftState.Ready;
        }
    }

    function entityCreated(eventData: IEntityCreatedEventData) {
        if (eventData.entity.__identifier__ !== "rift:rift") return;
            const rift = eventData.entity;

            //Create Pair
            const nameable = system.getComponent(rift, MinecraftComponent.Nameable);
            nameable.allowNameTagRenaming = false;

            let riftStateComponent = system.getComponent<RiftStateComponent>(rift, Components.RiftState);
            if (riftStateComponent !== null) {
                return;
            }
            if (riftStateComponent == null) {
                riftStateComponent = system.createComponent<RiftStateComponent>(rift, Components.RiftState);
                riftStateComponent.role = RiftRole.Primary;
                riftStateComponent.state = RiftState.Settling;
            }

            if (!!nameable.name) {
                const serializedData = <RiftStateComponent>JSON.parse(nameable.name);
                riftStateComponent.role = serializedData.role;
                riftStateComponent.state = serializedData.state;
                riftStateComponent.partnerLocation = serializedData.partnerLocation;
            }

            riftStateComponent.lastLocation = null;
            applyRiftComponentSettings(rift, riftStateComponent);

            displayRiftState(rift, riftStateComponent);
    }
}

