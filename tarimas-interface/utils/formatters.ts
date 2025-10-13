export const formatNumber = (value: number | null | undefined): string => {
    if (typeof value === "number" && !Number.isNaN(value)) {
        return value.toLocaleString();
    }

    return "N/A";
};

export const formatString = (value: string | null | undefined, fallback = "N/A"): string => {
    if (typeof value === "string") {
        const trimmed = value.trim();
        if (trimmed) {
            return trimmed;
        }
    }

    return fallback;
};

export const formatNumberWithUnit = (value: number | null | undefined, unitLabel: string): string => {
    const formattedNumber = formatNumber(value);
    return formattedNumber === "N/A" ? formattedNumber : `${formattedNumber} ${unitLabel}`;
};

export const coerceBoolean = (value: boolean | null | undefined): boolean => Boolean(value);
