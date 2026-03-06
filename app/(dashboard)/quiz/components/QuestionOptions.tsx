export function QuestionOptions({ options = [] }: { options?: string[] }) {
    return (
        <ul className="space-y-2">
            {options.map((opt, idx) => (
                <li
                    key={idx}
                    className="bg-green-500/20 hover:bg-green-500/30 transition p-2 rounded-lg border border-green-300/30 text-sm select-none pointer-events-none"
                >
                    {opt}
                </li>
            ))}
        </ul>
    );
}
