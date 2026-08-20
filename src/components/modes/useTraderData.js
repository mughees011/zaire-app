import { useState, useEffect, useCallback, useRef } from 'react';

// ─── Mock fallback data (used when backend is offline) ───────────────────────
const MOCK_MARKET_DATA = [
  { symbol: 'BTC-USD', displaySymbol: 'BTC', name: 'Bitcoin', price: 64230.5, change: 1527.8, changePercent: 2.44, high: 65100, low: 62890, volume: 32500000000, isHalal: true, isCrypto: true },
  { symbol: 'ETH-USD', displaySymbol: 'ETH', name: 'Ethereum', price: 3450.2, change: 40.8, changePercent: 1.2, high: 3520, low: 3380, volume: 18200000000, isHalal: true, isCrypto: true },
  { symbol: 'SOL-USD', displaySymbol: 'SOL', name: 'Solana', price: 145.8, change: 7.48, changePercent: 5.4, high: 152, low: 138, volume: 4100000000, isHalal: true, isCrypto: true },
  { symbol: 'BNB-USD', displaySymbol: 'BNB', name: 'BNB', price: 590.1, change: -4.72, changePercent: -0.79, high: 602, low: 580, volume: 1800000000, isHalal: true, isCrypto: true },
  { symbol: 'AAPL', displaySymbol: 'AAPL', name: 'Apple Inc.', price: 178.45, change: 1.94, changePercent: 1.1, high: 180.2, low: 176.8, volume: 55000000, isHalal: true, isCrypto: false },
  { symbol: 'MSFT', displaySymbol: 'MSFT', name: 'Microsoft Corp.', price: 428.3, change: 2.54, changePercent: 0.6, high: 431, low: 425, volume: 22000000, isHalal: true, isCrypto: false },
  { symbol: 'NVDA', displaySymbol: 'NVDA', name: 'NVIDIA Corp.', price: 875.4, change: 18.2, changePercent: 2.12, high: 882, low: 860, volume: 45000000, isHalal: true, isCrypto: false },
  { symbol: 'TSLA', displaySymbol: 'TSLA', name: 'Tesla Inc.', price: 215.1, change: -1.94, changePercent: -0.89, high: 220, low: 212, volume: 98000000, isHalal: true, isCrypto: false },
  { symbol: 'GC=F', displaySymbol: 'XAU', name: 'Gold', price: 2048.5, change: 6.14, changePercent: 0.3, high: 2055, low: 2040, volume: 180000, isHalal: true, isCommodity: true },
  { symbol: 'SI=F', displaySymbol: 'XAG', name: 'Silver', price: 27.45, change: 0.22, changePercent: 0.81, high: 27.8, low: 27.1, volume: 85000, isHalal: true, isCommodity: true },
];

/**
 * useTraderData
 * Polls the backend Yahoo Finance endpoint every 30s.
 * Falls back to realistic mock data if backend is offline.
 */
const useTraderData = (apiBase) => {
  const [prices, setPrices]         = useState(MOCK_MARKET_DATA);
  const [isLive, setIsLive]         = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [error, setError]           = useState(null);
  const [isLoading, setIsLoading]   = useState(true);
  const intervalRef = useRef(null);

  const fetchMarketData = useCallback(async () => {
    try {
      const url = `${apiBase}/api/trader/market-data`;
      const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json.ok && Array.isArray(json.data) && json.data.length > 0) {
        setPrices(json.data);
        setIsLive(true);
        setLastUpdated(new Date(json.updatedAt));
        setError(null);
      }
    } catch (err) {
      console.warn('[ZAIRE TRADER] Market data offline, using mock data:', err.message);
      setIsLive(false);
      setError(err.message);
      // Keep showing mock data — add small random fluctuation to feel alive
      setPrices(prev => prev.map(item => ({
        ...item,
        price: item.price * (1 + (Math.random() - 0.5) * 0.002),
        changePercent: item.changePercent + (Math.random() - 0.5) * 0.1,
      })));
    } finally {
      setIsLoading(false);
    }
  }, [apiBase]);

  useEffect(() => {
    fetchMarketData();
    intervalRef.current = setInterval(fetchMarketData, 30_000);
    return () => clearInterval(intervalRef.current);
  }, [fetchMarketData]);

  /**
   * Get a single symbol's data from the loaded prices
   */
  const getQuote = useCallback((symbol) => {
    return prices.find(p => p.symbol === symbol || p.displaySymbol === symbol) || null;
  }, [prices]);

  /**
   * Format a number as USD price string
   */
  const fmtPrice = (val, decimals = 2) => {
    if (val == null) return '—';
    return '$' + Number(val).toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  };

  const fmtPercent = (val) => {
    if (val == null) return '—';
    const sign = val >= 0 ? '+' : '';
    return `${sign}${Number(val).toFixed(2)}%`;
  };

  const fmtChange = (val) => {
    if (val == null) return '—';
    const sign = val >= 0 ? '+' : '';
    return `${sign}$${Math.abs(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return { prices, isLive, lastUpdated, error, isLoading, getQuote, fmtPrice, fmtPercent, fmtChange, refetch: fetchMarketData };
};

export default useTraderData;
