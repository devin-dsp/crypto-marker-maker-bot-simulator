const Simulator = require('./simulator');
const MarketMaker = require('./market_maker');

(async () => {
    const simulator = new Simulator('tETHUSD', 1, 5);
    const marketMaker = new MarketMaker('USD', 'ETH', 0.01);
    await simulator.init();
    simulator.orderBook.print();

    const recheckBalanceSec = 15;

    simulator.start();
    marketMaker.start(2000, 10, recheckBalanceSec);

    simulator.on('update', () => {
        marketMaker.checkState(simulator.orderBook);
        // if stopped
        if (!marketMaker.interval) {
            simulator.stop();
        }
    });
})();
