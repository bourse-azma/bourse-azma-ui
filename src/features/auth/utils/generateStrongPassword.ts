export const generateStrongPassword = () => {
    const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const lower = 'abcdefghijkmnopqrstuvwxyz';
    const digits = '23456789';
    const symbols = '!@#$%^&*_-+=?';
    const groups = [upper, lower, digits, symbols];
    const all = groups.join('');
    const randomIndex = (max: number) => {
        const maxUnbiased = Math.floor(0x1_0000_0000 / max) * max;
        const buffer = new Uint32Array(1);
        do {
            crypto.getRandomValues(buffer);
        } while (buffer[0] >= maxUnbiased);
        return buffer[0] % max;
    };
    const chars = groups.map((group) => group[randomIndex(group.length)]);
    while (chars.length < 16) {
        chars.push(all[randomIndex(all.length)]);
    }
    for (let i = chars.length - 1; i > 0; i--) {
        const j = randomIndex(i + 1);
        [chars[i], chars[j]] = [chars[j], chars[i]];
    }
    return chars.join('');
};
