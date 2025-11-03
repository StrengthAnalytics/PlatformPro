import React, { useRef, useEffect, useLayoutEffect } from 'react';

interface TumblerPickerProps {
    values: (string | number)[];
    currentValue: string | number;
    onChange: (newValue: string | number) => void;
    label: string;
    itemHeight: number;
    containerHeight: number;
}

const TumblerPicker: React.FC<TumblerPickerProps> = ({ values, currentValue, onChange, label, itemHeight, containerHeight }) => {
    const scrollRef = useRef<HTMLUListElement>(null);
    // Use refs to hold the latest props for use in the event listener, avoiding re-binding.
    const onChangeRef = useRef(onChange);
    onChangeRef.current = onChange;
    const currentValueRef = useRef(currentValue);
    currentValueRef.current = currentValue;

    const padding = (containerHeight - itemHeight) / 2;

    useLayoutEffect(() => {
        if (scrollRef.current) {
            const initialIndex = values.findIndex(v => v == currentValue);
            if (initialIndex !== -1) {
                // Use `scrollTo` with `instant` behavior to prevent animation on load/change
                scrollRef.current.scrollTo({ top: initialIndex * itemHeight, behavior: 'instant' });
            }
        }
    }, [currentValue, values, itemHeight]);

    useEffect(() => {
        const scrollContainer = scrollRef.current;
        if (!scrollContainer) return;

        let scrollTimeout: number;

        const handleScrollEnd = () => {
            const selectedIndex = Math.round(scrollContainer.scrollTop / itemHeight);
            const newValue = values[selectedIndex];
            
            // Use refs to access the latest props
            if (newValue !== undefined && newValue != currentValueRef.current) {
                onChangeRef.current(newValue);
            } else if (newValue !== undefined) {
                // If the user scrolls but ends up on the same value, we should still snap back to the exact position
                // to correct for any minor imprecision in the scroll.
                const correctScrollTop = selectedIndex * itemHeight;
                if (Math.abs(scrollContainer.scrollTop - correctScrollTop) > 1) { // Only scroll if it's off by more than a pixel
                     scrollContainer.scrollTo({ top: correctScrollTop, behavior: 'smooth' });
                }
            }
        };
        
        // This debounced scroll listener is a robust fallback for browsers that don't support 'scrollend'
        const handleScroll = () => {
            clearTimeout(scrollTimeout);
            scrollTimeout = window.setTimeout(handleScrollEnd, 150);
        };

        scrollContainer.addEventListener('scroll', handleScroll, { passive: true });

        return () => {
            scrollContainer.removeEventListener('scroll', handleScroll);
            clearTimeout(scrollTimeout);
        };
    }, [values, itemHeight]); // Dependencies that affect geometry, not the current value.

    return (
        <div className="flex items-center justify-center gap-2 text-xl font-semibold text-slate-800 dark:text-slate-100">
            <div 
                className="relative"
                style={{ height: `${containerHeight}px`, width: '80px' }}
            >
                <ul
                    ref={scrollRef}
                    className="w-full h-full overflow-y-scroll scroll-snap-type-y-mandatory no-scrollbar text-center [-webkit-overflow-scrolling:touch]"
                    style={{ paddingTop: `${padding}px`, paddingBottom: `${padding}px` }}
                >
                    {values.map((value) => (
                        <li
                            key={value}
                            className="scroll-snap-align-center flex items-center justify-center text-2xl"
                            style={{ height: `${itemHeight}px` }}
                        >
                            {String(value).padStart(2, '0')}
                        </li>
                    ))}
                </ul>
                 <div 
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        background: `linear-gradient(to bottom, var(--bg-color-translucent) 0%, transparent 45%, transparent 55%, var(--bg-color-translucent) 100%)`
                    }}
                >
                    <div 
                        className="h-full"
                        style={{ paddingTop: `${padding}px`, paddingBottom: `${padding}px`, boxSizing: 'border-box' }}
                    >
                         <div 
                            className="h-full border-y-2 border-slate-400 dark:border-slate-500"
                        ></div>
                    </div>
                </div>
            </div>
            <span>{label}</span>
        </div>
    );
};

export default TumblerPicker;