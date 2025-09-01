import type { PacketsType } from '../constants/packet-schema.constants';

export interface PacketHeaderInterface {
    type: PacketsType;
    suiteId: string;
    runnerId: string;
}

export interface PacketErrorInterface {
    error: string;
}
