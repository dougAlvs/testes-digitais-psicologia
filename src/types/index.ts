export interface Participant {
    name: string;
    age: number;
    gender: string;
    education: string;
    startTime?: string;
}

export interface PhaseConfig {
    name: string;
    instruction: string;
    trials: number;      
    showColor: boolean;  
    shuffleSlots: boolean; 
    randomizeColors: boolean; 
}

export type ItemKey = 'blusa' | 'meia' | 'calca' | 'tenis';

export interface TrialResponse {
    phaseId: number;
    phaseName: string
    trial: number;
    itemPresented: string;
    colorPresented: string;
    compartmentChosen: string;
    correct: boolean;
    responseTime: number;
    timestamp?: string;
}

export interface PhaseResult {
    phase: string;
    totalTrials: number;
    correctResponses: number;
    incorrectResponses: number;
    accuracy: number;
    averageResponseTime: number;
    totalTime: number;
}
export interface AnalysisResult {
    ageGroup: string;
    zScoreC: string;
    ratioC_B: string;
    interpretationHTML: string;
    interpretationText: string;
}

export interface TestResult {
    participant: Participant;
    testDate: string;
    summary: {
        totalTrials: number;
        correctResponses: number;
        incorrectResponses: number;
        overallAccuracy: number;
        overallAverageResponseTime: number;
    };
    phaseResults: Record<string, PhaseResult>;
    responses: TrialResponse[];
    analysis?: AnalysisResult;
}