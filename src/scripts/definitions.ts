export const enum Events {
    AnnounceClient = "rift:announce_client"
}

export const enum Components {
    RiftState = "rift:state"
}

export const enum Entity {
    Rift = "rift:rift"
}

export interface RiftStateComponent {
    lastLocation?: Vector;
    partnerLocation?: Vector;
    state: RiftState;
    role: RiftRole;
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