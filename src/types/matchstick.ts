export interface Matchstick {
    id: string;
    x: number;
    y: number;
    angle: number;
    length: number;
}

export interface MatchstickPhase {
    id: string;
    name: string;
    targetAnimationMatches: MatchstickConfig[];
    finalTarget: MatchstickConfig;
}

export interface MatchstickConfig {
    sticks: Matchstick[];
}

export interface MatchstickEvaluation {
    configurationParams: number;
    positioningParams: number;
    detailParams: number;
    totalPoints: number;
}
