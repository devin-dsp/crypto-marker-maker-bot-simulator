const Randomizer = require('./randomizer');

class MarketMaker {
    constructor(baseCurrency, quoteCurrency, accuracy = 0.01) {
        this.baseCurrency = baseCurrency;
        this.quoteCurrency = quoteCurrency;
        this.accuracy = accuracy;
        this.orders = {buy: [], sell: []};
        for (let i = 0; i < 5; i++) {
            this.orders.buy.push({price: 0, amount: 0});
            this.orders.sell.push({price: 0, amount: 0});
        }
    }

    placeOrder(side, order) {
        console.log(`PLACE ${side.toUpperCase()} @ ( ${this.quoteCurrency}: ${order.amount} ${this.baseCurrency}: ${order.price} )`);
    }

    fillOrder(side, order, even = false) {
        if (side === 'buy') {
            this.quoteBalance += order.amount;
            this.baseBalance -= order.amount * order.price;
        } else if (side === 'sell') {
            this.quoteBalance -= order.amount;
            this.baseBalance += order.amount * order.price;
        }
        if (even) {
            console.log(`EVEN BALANCE ${side.toUpperCase()} @ ( ${this.quoteCurrency}: ${order.amount} ${this.baseCurrency}: ${order.price} )`);
        }
    }

    evenBalances(bestBid, bestAsk) {
        const middlePrice = (bestBid.price + bestAsk.price) / 2;
        if (this.baseBalance < middlePrice * this.quoteBalance * 0.8) {
            this.fillOrder('sell', {
                price: bestBid.price,
                amount: 0.1 * this.quoteBalance,
            }, true);
        } else if (this.quoteBalance < this.baseBalance / middlePrice * 0.8) {
            this.fillOrder('buy', {
                price: bestAsk.price,
                amount: 0.1 * this.baseBalance / middlePrice,
            }, true);
        }
    }

    makeMarket(bestBid, bestAsk) {
        this.orders.buy.forEach((order, i) => {
            if (!order.amount) {
                order.price = Randomizer.float(bestBid.price * (100 - i) / 100, bestBid.price, this.accuracy);
                order.amount = Randomizer.float(0.1, 1.5, this.accuracy);
                this.placeOrder('buy', order);
            }
        });

        this.orders.sell.forEach((order, i) => {
            if (!order.amount) {
                order.price = Randomizer.float(bestAsk.price, bestAsk.price * (100 + i) / 100, this.accuracy);
                order.amount = Randomizer.float(0.1, 1.5, this.accuracy);
                this.placeOrder('sell', order);
            }
        });

        this.evenBalances(bestBid, bestAsk);
    }

    checkState(orderBook) {
        const bestBid = orderBook.bidFirst();
        const bestAsk = orderBook.askFirst();

        if (!bestBid || !bestAsk) {
            this.stop();
            return null;
        }

        let changed = false;

        this.orders.buy.forEach((order) => {
            if (order.price && (bestAsk.price < order.price)) {
                console.log(`FILLED BUY @ PRICE AMOUNT (${this.quoteCurrency}: ${order.amount} ${this.baseCurrency}: ${order.price})`);
                this.fillOrder('buy', order);
                order.amount = 0;
                order.price = 0;
                changed = true;
            }
        });
        this.orders.sell.forEach((order) => {
            if (order.price && (bestBid.price > order.price)) {
                console.log(`FILLED SELL @ PRICE AMOUNT (${this.quoteCurrency}: ${order.amount} ${this.baseCurrency}: ${order.price})`);
                this.fillOrder('sell', order);
                order.amount = 0;
                order.price = 0;
                changed = true;
            }
        });
        this.makeMarket(bestBid, bestAsk);
        if (changed) {
            orderBook.print();
        }
    }

    async start(baseBalance, quoteBalance, recheckBalanceSec = 30) {
        if (this.interval) {
            return null;
        }
        this.baseBalance = baseBalance;
        this.quoteBalance = quoteBalance;
        this.interval = setInterval(() => {
            console.log(`BALANCE @ (${this.quoteCurrency}: ${this.quoteBalance} ${this.baseCurrency}: ${this.baseBalance})`);
        }, recheckBalanceSec * 1000);
    }

    stop() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
    }
}

module.exports = MarketMaker;