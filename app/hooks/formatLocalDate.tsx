export const formatLocalDate = (
    dateString?: string | Date,
    editedString?: string | Date
) => {
    if (!dateString) return "";

    const parseDate = (d: string | Date) => {
        if (d instanceof Date) return d;
        if (typeof d === "string") return new Date(d.split(".")[0] + "Z");
        return new Date(); // fallback, shouldn't happen
    };

    const date = parseDate(dateString);
    const now = new Date();

    const diffMs = now.getTime() - date.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    let relativeTime = "";
    if (diffSeconds < 60) relativeTime = `${diffSeconds} seconds ago`;
    else if (diffMinutes < 60) relativeTime = `${diffMinutes} minutes ago`;
    else if (diffHours < 24) relativeTime = `${diffHours} hours ago`;
    else if (diffDays < 30) relativeTime = `${diffDays} days ago`;
    else {
        const diffMonths = Math.floor(diffDays / 30);
        if (diffMonths < 12) relativeTime = `${diffMonths} month${diffMonths > 1 ? "s" : ""} ago`;
        else {
            const diffYears = Math.floor(diffMonths / 12);
            relativeTime = `${diffYears} year${diffYears > 1 ? "s" : ""} ago`;
        }
    }

    let edited = false;
    if (editedString) {
        const editedDate = parseDate(editedString);
        edited = editedDate.getTime() !== date.getTime();
    }

    return (
        <span>
            {relativeTime}{" "}
    {edited && (
        <span className="text-black text-[10px] ml-1">
            (Edited)
            </span>
    )}
    </span>
);
};