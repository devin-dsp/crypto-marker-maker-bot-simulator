const EventEmitter = require('events');
const Randomizer = require('./randomizer');
const orderBook = require('./orderbook');

class ExchangeSimulator extends EventEmitter {
    constructor(pair, minAmount, maxAmount) {
        super();
        this.orderBook = new orderBook(pair);
        this.minAmount = minAmount;
        this.maxAmount = maxAmount

        this.stopped = true;
    }

    async init() {
        await this.orderBook.init();
        this.minPrice = 0.9 * this.orderBook.bidFirst();
        this.maxPrice = 1.1 * this.orderBook.askFirst();
        this.emit('update', this.orderBook.orderBookData);
    }

    orderProcess(side, price, amount) {
        // console.log({side, price, amount});
        this[side](price, amount);
        this.orderCreateRandom();
    }

    orderCreateRandom() {
        if (this.stopped) {
            return null;
        }
        let timeout = setTimeout(() => {
            clearTimeout(timeout);
            timeout = null;
            this.emit(
                'order',
                'sell', // Randomizer.array(['buy', 'sell'])[0],
                Randomizer.float(this.minPrice, this.maxPrice),
                Randomizer.float(this.minAmount, this.maxAmount),
            );
        }, Randomizer.integer(100, 500));
    }

    sell(priceSell, amountSell) {
        let amountSold = 0;
        let amountReceived = 0;
        let amountToSell = amountSell;
        let {orderBookData} = this.orderBook;
        for (const i in orderBookData) {
            const order = orderBookData[i];
            const price = order[0];
            const amount = order[2];

            if (price < priceSell) {
                break;
            }

            if (amount > amountToSell) {
                order[2] -= amountToSell;
                amountSold += amountToSell;
                amountReceived += amountToSell * price;
                amountToSell = 0;
                break;
            }

            amountToSell -= amount;
            amountSold += amount;
            amountReceived += amount * price;
            order[2] = 0;
        }

        this.orderBook.update(orderBookData);

        if (amountToSell > 0) {
            // place to ask
            this.askAdd(priceSell, amountToSell);
        }

        // clear order book zero items
        this.orderBookClear(orderBookData);

        this.emit('update', this.orderBook.orderBookData);
    }

    start() {
        if (this.stopped) {
            this.stopped = false;
            this.on('order', this.orderProcess.bind(this));
            this.orderCreateRandom();
        }
    }

    stop() {
        if (!this.stopped) {
            this.stopped = true;
            this.removeAllListeners('order');
            this.removeAllListeners('update');
        }
    }

    orderBookClear() {
        // todo optimize
        this.orderBook.orderBookData = this.orderBook.orderBookData.filter((order) => {
            return order[2] !== 0;
        });
    }

    askAdd(priceAdd, amountAdd) {
        let i = 0;
        let { orderBookData } = this.orderBook;
        do {
            const order = orderBookData[i];
            const price = order[0];
            const amount = order[2];
            if ((amount < 0) && (price > priceAdd)) {
                break;
            }
        } while (++i < orderBookData.length);

        const newOrder = [priceAdd, 1, -1 * amountAdd];

        if (i === orderBookData.length) {
            orderBookData.push(newOrder);
            return null;
        }

        if (orderBookData[i][0] === priceAdd) {
            orderBookData[i][1] += 1;
            orderBookData[i][2] += amountAdd;
        } else {
            orderBookData.splice(i, 0, newOrder);
        }
        this.orderBook.update(orderBookData);
    }
}

module.exports = ExchangeSimulator;
