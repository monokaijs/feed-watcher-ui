'use client';

import { useEffect, useState, ReactNode } from 'react';
import { registerServiceWorker, addOnlineStatusListener, checkOnlineStatus } from '@/lib/service-worker';
import { Wifi, WifiOff } from 'lucide-react';

interface ServiceWorkerProviderProps {
  children: ReactNode;
}

export function ServiceWorkerProvider({ children }: ServiceWorkerProviderProps) {
  const [isOnline, setIsOnline] = useState(true);
  const [showOfflineNotice, setShowOfflineNotice] = useState(false);

  useEffect(() => {
    // Register service worker
    registerServiceWorker();

    // Set initial online status
    setIsOnline(checkOnlineStatus());

    // Listen for online/offline events
    const removeListener = addOnlineStatusListener((online) => {
      setIsOnline(online);
      if (!online) {
        setShowOfflineNotice(true);
      } else {
        setShowOfflineNotice(false);
      }
    });

    return removeListener;
  }, []);

  return (
    <>
      {children}
      
      {/* Offline Notice */}
      {showOfflineNotice && (
        <div className="fixed top-0 left-0 right-0 bg-yellow-500 text-white px-4 py-2 text-center text-sm z-50">
          <div className="flex items-center justify-center gap-2">
            <WifiOff className="w-4 h-4" />
            <span>You&apos;re offline. Some features may not work properly.</span>
          </div>
        </div>
      )}

      {/* Online Status Indicator */}
      <div className="fixed top-4 left-4 z-40">
        <div className={`flex items-center gap-2 px-2 py-1 rounded-full text-xs ${
          isOnline 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          {isOnline ? (
            <>
              <Wifi className="w-3 h-3" />
              <span>Online</span>
            </>
          ) : (
            <>
              <WifiOff className="w-3 h-3" />
              <span>Offline</span>
            </>
          )}
        </div>
      </div>
    </>
  );
}
