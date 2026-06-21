import type {SymbolSearchSuggestion} from './types';

export const POPULAR_SYMBOLS: SymbolSearchSuggestion[] = [
    {
        key: 'TSE:فولاد:46348559193224090',
        type: 'TSE',
        symbol: 'فولاد',
        name: 'فولاد مبارکه اصفهان',
        instrumentCode: '46348559193224090',
        isin: null,
        oldInstrumentCodes: [],
    },
    {
        key: 'TSE:فجر:41302553376174581',
        type: 'TSE',
        symbol: 'فجر',
        name: 'فولاد امیرکبیر کاشان',
        instrumentCode: '41302553376174581',
        isin: null,
        oldInstrumentCodes: [],
    },
    {
        key: 'TSE:وبملت:778253364357513',
        type: 'TSE',
        symbol: 'وبملت',
        name: 'بانک ملت',
        instrumentCode: '778253364357513',
        isin: null,
        oldInstrumentCodes: [],
    },
    {
        key: 'TSE:فملی:35425587644337450',
        type: 'TSE',
        symbol: 'فملی',
        name: 'ملی صنایع مس ایران',
        instrumentCode: '35425587644337450',
        isin: null,
        oldInstrumentCodes: [],
    },
    {
        key: 'TSE:شپنا:7745894403636165',
        type: 'TSE',
        symbol: 'شپنا',
        name: 'پالایش نفت اصفهان',
        instrumentCode: '7745894403636165',
        isin: null,
        oldInstrumentCodes: [],
    },
    {
        key: 'TSE:وغدیر:26014913469567886',
        type: 'TSE',
        symbol: 'وغدیر',
        name: 'سرمایه‌گذاری غدیر',
        instrumentCode: '26014913469567886',
        isin: null,
        oldInstrumentCodes: [],
    },
    {
        key: 'TSE:خودرو:65883838195688438',
        type: 'TSE',
        symbol: 'خودرو',
        name: 'ایران خودرو',
        instrumentCode: '65883838195688438',
        isin: null,
        oldInstrumentCodes: [],
    },
    {
        key: 'TSE:شستا:2400322364771558',
        type: 'TSE',
        symbol: 'شستا',
        name: 'سرمایه‌گذاری تأمین اجتماعی',
        instrumentCode: '2400322364771558',
        isin: null,
        oldInstrumentCodes: [],
    },
    {
        key: 'TSE:کگل:35700344742885862',
        type: 'TSE',
        symbol: 'کگل',
        name: 'معدنی و صنعتی گل‌گهر',
        instrumentCode: '35700344742885862',
        isin: null,
        oldInstrumentCodes: [],
    },
    {
        key: 'TSE:وتجارت:63917421733088077',
        type: 'TSE',
        symbol: 'وتجارت',
        name: 'بانک تجارت',
        instrumentCode: '63917421733088077',
        isin: null,
        oldInstrumentCodes: [],
    },
    {
        key: 'TSE:خساپا:44891482026867833',
        type: 'TSE',
        symbol: 'خساپا',
        name: 'سایپا',
        instrumentCode: '44891482026867833',
        isin: null,
        oldInstrumentCodes: [],
    },
    {
        key: 'TSE:وبصادر:28320293733348826',
        type: 'TSE',
        symbol: 'وبصادر',
        name: 'بانک صادرات ایران',
        instrumentCode: '28320293733348826',
        isin: null,
        oldInstrumentCodes: [],
    },
    {
        key: 'TSE:وپارس:33293588228706998',
        type: 'TSE',
        symbol: 'وپارس',
        name: 'بانک پارسیان',
        instrumentCode: '33293588228706998',
        isin: null,
        oldInstrumentCodes: [],
    },
];

const pickRandomItem = <T, >(items: T[]): T | null => {
    if (items.length === 0) return null;
    const values = new Uint32Array(1);
    crypto.getRandomValues(values);
    return items[values[0] % items.length] ?? null;
};

export const pickRandomPopularSymbol = (): SymbolSearchSuggestion =>
    pickRandomItem(POPULAR_SYMBOLS) ?? POPULAR_SYMBOLS[0];
