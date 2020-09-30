const axios = require('axios');

class Request {
    constructor() {
        this.baseUrl = `https://api.deversifi.com/bfx/v2/book/`
    }

    async _request(subUrl) {
        const res = await axios.get(
            `${this.baseUrl}${subUrl}`,
        );
        if (res.status !== 200) {
            throw new Error(`BAD_RESPONSE_STATUS: ${res.status}`);
        }
        this._validate(res.data);
        return res.data;
    }

    _validate() {
    }
}

module.exports = Request;
