import { Components, RiftStateComponent, RiftState, RiftRole, Entity, RecentTeleport } from "../definitions";

const searchSize = 5;
const teleportDistance = 3 * 3; // 3 blocks to teleport;

namespace TeleportPlayer {
    const system = server.registerSystem(0, 0);
    let spatialView: ISpatialView;

    system.initialize = function() {
        const exampleRiftStateComponent: RiftStateComponent = {
            partnerLocation: [0, 0, 0],
            lastLocation: [0, 0, 0],
            state: RiftState.Settling,
            role: RiftRole.Primary
        }

        const exampleRecentTeleport: RecentTeleport = {
            riftLocation: [0, 0, 0]
        }

        system.registerComponent(Components.RiftState, exampleRiftStateComponent);
        system.registerComponent(Components.RecentTeleport, exampleRecentTeleport);

        spatialView = system.registerSpatialView(MinecraftComponent.Position, "x", "y", "z");

        system.listenForEvent(MinecraftServerEvent.EntityTick, entityTick);
    }

    function entityTick(entityData: IEntityTickEventData) {
        const entity = entityData.entity;
        if (entity.__identifier__ !== "rift:rift") return;
        const rift = entity;
        const riftStateComponent = system.getComponent<RiftStateComponent>(rift, Components.RiftState);
        if (riftStateComponent.state !== RiftState.Ready) return;

        const position = system.getComponent(rift, MinecraftComponent.Position);
        const entities = system.getEntitiesFromSpatialView(
            spatialView,
            position.x - searchSize,
            position.y - searchSize,
            position.z - searchSize,
            position.x + searchSize,
            position.y + searchSize,
            position.z + searchSize);

        const destinationRifts = system.getEntitiesFromSpatialView(
                spatialView,
                riftStateComponent.partnerLocation[0] - searchSize,
                riftStateComponent.partnerLocation[1] - searchSize,
                riftStateComponent.partnerLocation[2] - searchSize,
                riftStateComponent.partnerLocation[0] + searchSize,
                riftStateComponent.partnerLocation[1] + searchSize,
                riftStateComponent.partnerLocation[2] + searchSize);

        if (destinationRifts.length === 0) {
            //FIXME: Destroy this rift?
            return;
        }

        //FIXME: destinationRifts.length > 1?
        const destinationRift = destinationRifts[0];
        const destinationRiftPosition = system.getComponent(destinationRift, MinecraftComponent.Position);

        if (entities.length === 0) return;

        for (const entity of entities) {
            if (entity.__identifier__ === Entity.Rift) continue;
            let recentTeleport = system.getComponent<RecentTeleport>(entity, Components.RecentTeleport);

            const entityPosition = system.getComponent(entity, MinecraftComponent.Position);
            if (distanceSq(position, entityPosition) > teleportDistance) {
                if (!!recentTeleport) {
                    system.destroyComponent(entity, Components.RecentTeleport);
                }
                continue;
            }

            if (!!recentTeleport &&
                    recentTeleport.riftLocation[0] === position.x &&
                    recentTeleport.riftLocation[1] === position.y &&
                    recentTeleport.riftLocation[2] === position.z) {
                continue;
            }
            if (!recentTeleport) {
                recentTeleport = system.createComponent<RecentTeleport>(entity, Components.RecentTeleport);
            }
            
            entityPosition.x = recentTeleport.riftLocation[0] = destinationRiftPosition.x;
            entityPosition.y = recentTeleport.riftLocation[1] = destinationRiftPosition.y;
            entityPosition.z = recentTeleport.riftLocation[2] = destinationRiftPosition.z;            
            
            system.applyComponentChanges(entityPosition);
            system.applyComponentChanges(recentTeleport);

            system.broadcastEvent(BroadcastableServerEvent.DisplayChat, `Teleported ${entity.__identifier__} to ${entityPosition.x},${entityPosition.y},${entityPosition.z}`);
        }
    }

    export function distanceSq(posA: IPositionComponent, posB: IPositionComponent) {
        return ((posB.x - posA.x) * (posB.x - posA.x)) +
            ((posB.y - posA.y) * (posB.y - posA.y)) +
            ((posB.z - posA.z) * (posB.z - posA.z))
    }
}

