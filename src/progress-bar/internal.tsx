// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import React, { ReactNode, useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';
import { BoxProps } from '../box/interfaces';
import InternalBox from '../box/internal';
import { ButtonProps } from '../button/interfaces';
import { InternalButton } from '../button/internal';
import InternalStatusIndicator from '../status-indicator/internal';

import { ProgressBarProps } from './interfaces';
import styles from './styles.css.js';

import { throttle } from '../internal/utils/throttle';
import LiveRegion from '../internal/components/live-region';

const MAX_VALUE = 100;
const ASSERTION_FREQUENCY = 5000; // interval in ms between progress announcements

const clamp = (value: number, lowerLimit: number, upperLimit: number) => {
  return Math.max(Math.min(value, upperLimit), lowerLimit);
};

interface ProgressProps {
  label: ReactNode;
  type: 'percentage' | 'ratio';
  value: number;
  maxValue: number;
  isInFlash: boolean;
  labelId: string;
  ariaValueText?: string;
}
export const Progress = ({
  label,
  value,
  maxValue = MAX_VALUE,
  type,
  isInFlash,
  labelId,
  ariaValueText,
}: ProgressProps) => {
  const roundedValue = Math.round(value);
  const progressValue = clamp(roundedValue, 0, maxValue);
  const isRatio = type === 'ratio';
  const percentage = isRatio && maxValue !== 100 ? Math.round(((progressValue * 1.0) / maxValue) * 100) : progressValue;
  const valueText = isRatio ? ariaValueText || `${progressValue}/${maxValue}` : `${percentage}%`;

  const [assertion, setAssertion] = useState('');
  const throttledAssertion = useMemo(() => {
    return throttle((value: ProgressBarProps['value']) => {
      const announcement = type === 'ratio' ? `${value} of ${maxValue}}` : `${value}%`;
      setAssertion(`${label ?? ''}: ${announcement}`);
    }, ASSERTION_FREQUENCY);
  }, [label, type, maxValue]);

  useEffect(() => {
    throttledAssertion(value);
  }, [throttledAssertion, value]);

  return (
    <>
      <div className={styles['progress-container']}>
        <progress
          className={clsx(
            styles.progress,
            progressValue >= maxValue && styles.complete,
            isInFlash && styles['progress-in-flash']
          )}
          max={maxValue}
          value={progressValue}
          aria-valuemin={0}
          aria-valuemax={maxValue}
          aria-labelledby={labelId}
          aria-valuenow={isRatio ? progressValue : percentage}
          aria-valuetext={valueText}
        />
        <span aria-hidden="true" className={styles['percentage-container']}>
          <InternalBox className={styles.percentage} variant="small" color={isInFlash ? 'inherit' : undefined}>
            {valueText}
          </InternalBox>
        </span>
      </div>
      <LiveRegion delay={0}>{assertion}</LiveRegion>
    </>
  );
};

interface SmallTextProps {
  color?: BoxProps.Color;
  children: React.ReactNode;
}

export const SmallText = ({ color, children }: SmallTextProps) => {
  return (
    <InternalBox className={styles['word-wrap']} variant="small" display="block" color={color}>
      {children}
    </InternalBox>
  );
};

const ResultButton = ({ onClick, children }: ButtonProps) => {
  return (
    <div className={styles['result-button']}>
      <InternalButton formAction="none" onClick={onClick}>
        {children}
      </InternalButton>
    </div>
  );
};

interface ResultStateProps {
  isInFlash: boolean;
  resultText: React.ReactNode;
  resultButtonText?: string;
  status: ProgressBarProps.Status;
  onClick: () => void;
}

export const ResultState = ({ isInFlash, resultText, resultButtonText, status, onClick }: ResultStateProps) => {
  const hasResultButton = !!resultButtonText;

  if (isInFlash) {
    return (
      <div className={styles[`result-container-${status}`]} aria-live="polite" aria-atomic="true">
        <span className={styles['result-text']}>{resultText}</span>
      </div>
    );
  }

  return (
    <div className={styles[`result-container-${status}`]} aria-live="polite" aria-atomic="true">
      <span className={clsx(hasResultButton && styles['with-result-button'])}>
        <InternalStatusIndicator type={status === 'success' ? 'success' : 'error'}>
          <span className={styles['result-text']}>{resultText}</span>
        </InternalStatusIndicator>
      </span>
      {hasResultButton && <ResultButton onClick={onClick}>{resultButtonText}</ResultButton>}
    </div>
  );
};
