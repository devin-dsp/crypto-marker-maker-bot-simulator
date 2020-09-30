const Request = require('./request');

class OrderBook extends Request {
    constructor(pair) {
        super();
        this.pair = pair;

    }

    parse() {
        this.orderBookData.forEach((item) => {
            const order = {};
            [
                order.price,
                order.count,
                order.amount,
            ] = item;
            if (order.amount > 0) {
                order.index = this.bidList.length;
                this.bidList.push(order);
            } else {
                order.index = this.askList.length;
                this.askList.push(order);
            }
        });
        this.bid = this.bidList[0];
        this.ask = this.askList[0];
        this.spreadCalculate();
    }

    print(depth = 5) {
        const emptyItem = {price: '--', amount: '--', count: '--'};
        console.table(this.bidList.slice(0, depth).reverse().concat([emptyItem], this.askList.slice(0, depth)));
    }

    async init() {
        const orderBookData = await this._request(`${this.pair}/P0`);
        this.update(orderBookData);
    }

    async update(orderBookData) {
        this.bidList = [];
        this.askList = [];
        this.orderBookData = orderBookData;
        this.parse();
    }

    spreadCalculate() {
        const bestBid = this.bidFirst();
        const bestAsk = this.askFirst();
        if (!bestBid || !bestAsk) {
            return 0;
        }
        return bestAsk.price - bestBid.price;
    }

    bidFirst() {
        this.bid = this.bidList[0];
        return this.bid;
    }

    askFirst() {
        this.ask = this.askList[0];
        return this.ask;
    }

    askNext() {
        this.ask = this.askList[this.ask.index + 1];
        return this.ask;
    }

    bidNext() {
        this.bid = this.bidList[this.bid.index + 1];
        return this.bid;
    }
}

module.exports = OrderBook;
