import { NextRequest, NextResponse } from "next/server";

// Example mock questions
const mockQuestions = [
    {
        id: 1,
        question: "What respirator is used whenever there is not enough oxigen in a confined space or area, and where the concentration of the airborne substation that is present is immediately dangerous for life or health",
        options: [
            "Provide for periodic inspection.",
            "Pertain to electric equipment only.",
            "Control energy for purpose of safety.",
            "Prevent unexpected intrusion.",
            "Require disconnection of equipment."
        ],
        answer: "Control energy for purpose of safety.",
        explanation:
            "Lockout/Tagout (LOTO) procedures are designed to control hazardous energy sources during maintenance or servicing of equipment. This ensures that machinery cannot start unexpectedly, preventing injuries. The primary purpose is to control energy for safety, not just to disconnect equipment or inspect periodically."
    },
    {
        "id": 28,
        "question": "Measuring the resistivity of earth with the typical ground resistance test set is accomplished by",
        "options": [
            "The two point method",
            "The fall of potential method",
            "The three point method",
            "Use of four electrodes"
        ],
        "answer": "Use of four electrodes",
        "explanation": "Earth resistivity is measured using the four-electrode (Wenner) method, where two outer electrodes supply current and two inner electrodes measure voltage."
    },
    {
        "id": 29,
        "question": "After reaching the maximum intended voltage level during an applied voltage withstand (hipot) test, and completion of the intended time element, the test set operator should limit exceeding of the specified time and voltage parameters by",
        "options": [
            "Turn the test set supply switch to off",
            "Apply the ground to the specimen",
            "Return the test set auto transformer to its zero position",
            "Disconnect the test set output lead",
            "None of the above"
        ],
        "answer": "Return the test set auto transformer to its zero position",
        "explanation": "After completing a hipot test, the operator should gradually reduce the voltage to zero by returning the autotransformer to its zero position before turning off or grounding to prevent sudden discharge or equipment damage."
    },
    {
        "id": 30,
        "question": "When connecting a multi lead high potential test set, thumper, insulation power factor test set, or like apparatus, connect the _______ lead first, and the _______ lead last",
        "options": [
            "Supply lead first and ground lead last",
            "Guard lead first and high voltage lead last",
            "Ground lead first and supply lead last",
            "Interconnecting lead first and guard lead last",
            "High voltage lead first and ground lead last"
        ],
        "answer": "Ground lead first and supply lead last",
        "explanation": "When connecting high-voltage test equipment, always connect the ground lead first to ensure safety, and connect the supply lead last to prevent accidental energization during setup."
    },
    {
        "id": 31,
        "question": "Per NETA, digital type field tests instruments should be calibration checked at least every",
        "options": [
            "Month",
            "Three months",
            "Six months",
            "Twelve months",
            "Two years"
        ],
        "answer": "Twelve months",
        "explanation": "According to NETA standards, digital field test instruments must be calibration checked at least every twelve months to ensure accuracy and reliability of test results."
    },
    {
        "id": 32,
        "question": "Testing procedures should assure that current transformer circuits can not be",
        "options": [
            "Open circuited",
            "Grounded",
            "Shorted",
            "Unconnected",
            "Exposed to the element"
        ],
        "answer": "Open circuited",
        "explanation": "Current transformer circuits should never be open-circuited during testing because it can produce dangerously high voltages, potentially damaging the equipment or causing injury."
    },
    {
        "id": 33,
        "question": "The guard terminal of an insulation resistance tester may be used to",
        "options": [
            "Eliminate the effects of transient currents from exterior sources",
            "Add to the measurement a second value, in order to measure the total leakage",
            "Allow the measurement of only one of two leakage paths",
            "Block the division of the test voltage applied, which can result in a higher than actual resistant measurement",
            "Include surface leakage, if desired"
        ],
        "answer": "Allow the measurement of only one of two leakage paths",
        "explanation": "The guard terminal on an insulation resistance tester is used to bypass or isolate one leakage path, allowing the measurement of only the desired leakage path while eliminating the influence of other parallel leakage currents."
    },
    {
        "id": 34,
        "question": "The time period necessary to fully release the stored energy developed in the cable, windings, capacitor or other capacitate device, after application of dc insulation resistance test is",
        "options": [
            "Four times as long as the test voltage was applied",
            "Equal to the length of time that the test voltage was applied",
            "One half the length of the time that the test voltage was applied",
            "Considered to be 5.0 minutes",
            "One minute"
        ],
        "answer": "Four times as long as the test voltage was applied",
        "explanation": "After a DC insulation resistance test, the stored energy in cables, windings, or capacitive devices must be allowed to fully dissipate. This typically requires a time period approximately four times longer than the duration the test voltage was applied to ensure safety and accurate measurement."
    },
    {
        "id": 35,
        "question": "After connection of test equipment is complete, you should next",
        "options": [
            "Turn the test set to on",
            "Assure personnel are aware of the impending test",
            "Begin the test, following appropriate or specified procedure",
            "Check that the test equipment calibration is current",
            "Recheck test equipment connections and settings"
        ],
        "answer": "Recheck test equipment connections and settings",
        "explanation": "After connecting test equipment, always recheck all connections and settings to ensure safety and proper operation before applying power or beginning the test."
    },
    // You can add more questions here
];

export async function GET(req: NextRequest) {
    return NextResponse.json(mockQuestions);
}
