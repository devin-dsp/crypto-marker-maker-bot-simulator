module.exports = class Randomizer {
    static array(array) {
        return array.sort(() => Math.random() - 0.5);
    }

    static integer(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    static float(min, max, fixed = 2) {
        return parseFloat( (Math.random() * (max - min) + min).toFixed(2));
    }
}

