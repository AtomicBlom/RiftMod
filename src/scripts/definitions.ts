/// <reference types="minecraft-scripting-types-shared" />

export const enum Events {
    AnnounceClient = "rift:announce_client",
    TeleportClient = "rift:teleport_client"
}

export const enum Components {
    RiftState = "rift:state",
    RecentTeleport = "rift:recent_teleport"
}

export const enum Entity {
    Rift = "rift:rift"
}

export interface RiftStateComponent extends IComponent {
    lastLocation?: Vector;
    partnerLocation?: Vector;
    state: RiftState;
    role: RiftRole;
}

export interface RecentTeleport extends IComponent {
    riftLocation: Vector
}

export const enum RiftRole {
    Primary = "primary",
    Secondary = "secondary"
}

export const enum RiftState {
    Settling = "settling",
    WaitingForPartnerToSettle = "partnerSettle",
    Ready = "ready"
}