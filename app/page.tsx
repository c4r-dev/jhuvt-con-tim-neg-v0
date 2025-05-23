// app/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import data from '../public/data.json';

interface DataPoint {
  condition: string;
  time: string;
  value: number;
  grp: string;
}

interface Statistics {
  mean: number;
  standardDeviation: number;
  count: number;
}

export default function Home() {
  const [showResults, setShowResults] = useState(false);
  const [statistics, setStatistics] = useState<Record<string, Statistics>>({});
  const [pValues, setPValues] = useState<Record<string, number>>({});

  const newBaseButtonStyle: React.CSSProperties = {
    padding: '10px 15px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '1rem',
  };

  // Statistical calculation functions
  const calculateMean = (values: number[]): number => {
    return values.reduce((sum, value) => sum + value, 0) / values.length;
  };

  const calculateStandardDeviation = (values: number[], mean: number): number => {
    const variance = values.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / (values.length - 1);
    return Math.sqrt(variance);
  };

  // Two-sample t-test for p-value calculation
  const calculateTTest = (group1: number[], group2: number[]): number => {
    const mean1 = calculateMean(group1);
    const mean2 = calculateMean(group2);
    const std1 = calculateStandardDeviation(group1, mean1);
    const std2 = calculateStandardDeviation(group2, mean2);
    const n1 = group1.length;
    const n2 = group2.length;

    const pooledStd = Math.sqrt(((n1 - 1) * std1 * std1 + (n2 - 1) * std2 * std2) / (n1 + n2 - 2));
    const tStat = (mean1 - mean2) / (pooledStd * Math.sqrt(1/n1 + 1/n2));
    const df = n1 + n2 - 2;

    // Approximate p-value calculation (simplified)
    const pValue = 2 * (1 - Math.abs(tStat) / Math.sqrt(df + Math.pow(tStat, 2)));
    return Math.max(0, Math.min(1, pValue));
  };

  const calculateStatistics = () => {
    const typedData = data as DataPoint[];
    const groupedData: Record<string, number[]> = {};

    // Group data by condition and time
    typedData.forEach(point => {
      const key = `${point.condition}_${point.time}`;
      if (!groupedData[key]) {
        groupedData[key] = [];
      }
      groupedData[key].push(point.value);
    });

    // Calculate statistics for each group
    const newStatistics: Record<string, Statistics> = {};
    Object.entries(groupedData).forEach(([key, values]) => {
      const mean = calculateMean(values);
      const standardDeviation = calculateStandardDeviation(values, mean);
      newStatistics[key] = {
        mean,
        standardDeviation,
        count: values.length
      };
    });

    // Calculate p-values for comparisons
    const newPValues: Record<string, number> = {};
    
    // Compare pre vs post for each condition
    if (groupedData['control_pre'] && groupedData['control_post']) {
      newPValues['control_pre_vs_post'] = calculateTTest(groupedData['control_pre'], groupedData['control_post']);
    }
    
    if (groupedData['treatment_A_pre'] && groupedData['treatment_A_post']) {
      newPValues['treatment_A_pre_vs_post'] = calculateTTest(groupedData['treatment_A_pre'], groupedData['treatment_A_post']);
    }

    // Compare control vs treatment at each time point
    if (groupedData['control_pre'] && groupedData['treatment_A_pre']) {
      newPValues['pre_control_vs_treatment'] = calculateTTest(groupedData['control_pre'], groupedData['treatment_A_pre']);
    }
    
    if (groupedData['control_post'] && groupedData['treatment_A_post']) {
      newPValues['post_control_vs_treatment'] = calculateTTest(groupedData['control_post'], groupedData['treatment_A_post']);
    }

    setStatistics(newStatistics);
    setPValues(newPValues);
    setShowResults(true);
  };
  
  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '20px auto 20px auto' }}>
      <div className="flex flex-col p-6 bg-gray-50 border border-gray-200 rounded-lg">
        <h2 className="text-lg font-semibold mb-4">Research question specifying treatments and dependent variable:</h2>
        <p className="text-blue-700 font-medium mb-6">Does compound A ameliorate grip strength in a mouse model of Amyotrophic Lateral Sclerosis</p>
        
        <h3 className="text-lg font-semibold mb-3">Study Description</h3>
        <p className="text-gray-700 mb-6 leading-relaxed">
          A research team develops a two-arm study assessing the efficacy of Compound A on treating grip strength impairment in cases of amyotrophic lateral sclerosis (ALS) in a model mouse organism. The team masks their sample allocation and randomly assigns their study population to a control group administered Placebo D and a treatment group administered Compound A. The team assesses grip strength using a standardized rotarod test with a max time of 180 sec or each sample in each group prior to the treatment (day 110) and after the treatment (day 120).
        </p>
        
        <h3 className="text-lg font-semibold mb-3">Likely value range for dependent variable with units:</h3>
        <div className="text-gray-700">
          <p className="mb-2">0-180 seconds (rotarod performance).</p>
          <p className="ml-8 mb-1">180 (control)</p>
          <p className="ml-8">80-140 (ALS)</p>
        </div>
      </div>
      
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '32px' }}>
        <button className="button" style={newBaseButtonStyle} onClick={calculateStatistics}>
          SHOW RESULTS
        </button>
      </div>

      {showResults && (
        <div className="mt-8 p-6 bg-white border border-gray-300 rounded-lg">
          <h2 className="text-xl font-bold mb-6 text-center">Statistical Results</h2>
          
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Condition</th>
                  <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Time</th>
                  <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Mean (seconds)</th>
                  <th className="border border-gray-300 px-4 py-3 text-left font-semibold">SD (seconds)</th>
                  <th className="border border-gray-300 px-4 py-3 text-left font-semibold">N</th>
                  <th className="border border-gray-300 px-4 py-3 text-left font-semibold">P-value</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(statistics).map(([key, stats]) => {
                  const [condition, time] = key.split('_');
                  const conditionDisplay = condition === 'treatment' ? 'Treatment A' : 
                                         condition.charAt(0).toUpperCase() + condition.slice(1);
                  const timeDisplay = time.charAt(0).toUpperCase() + time.slice(1);
                  
                  // Get relevant p-value for this row
                  let pValue = null;
                  let pValueLabel = '';
                  
                  if (condition === 'control' && time === 'pre') {
                    pValue = pValues['control_pre_vs_post'];
                    pValueLabel = 'Pre vs Post';
                  } else if (condition === 'control' && time === 'post') {
                    pValue = pValues['control_pre_vs_post'];
                    pValueLabel = 'Pre vs Post';
                  } else if (key === 'treatment_A_pre') {
                    pValue = pValues['treatment_A_pre_vs_post'];
                    pValueLabel = 'Pre vs Post';
                  } else if (key === 'treatment_A_post') {
                    pValue = pValues['treatment_A_pre_vs_post'];
                    pValueLabel = 'Pre vs Post';
                  }
                  
                  return (
                    <tr key={key} className="hover:bg-gray-50">
                      <td className="border border-gray-300 px-4 py-3">{conditionDisplay}</td>
                      <td className="border border-gray-300 px-4 py-3">{timeDisplay}</td>
                      <td className="border border-gray-300 px-4 py-3">{stats.mean.toFixed(2)}</td>
                      <td className="border border-gray-300 px-4 py-3">{stats.standardDeviation.toFixed(2)}</td>
                      <td className="border border-gray-300 px-4 py-3">{stats.count}</td>
                      <td className="border border-gray-300 px-4 py-3">
                        {pValue !== null ? (
                          <span className={pValue < 0.05 ? 'text-red-600 font-semibold' : 'text-gray-700'}>
                            {pValue.toFixed(4)} {pValue < 0.05 ? '*' : ''}
                            <br />
                            <span className="text-xs text-gray-500">({pValueLabel})</span>
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            
            <div className="mt-4 text-sm text-gray-600">
              <p>* p &lt; 0.05 (statistically significant)</p>
              <p className="mt-2"><strong>Additional Comparisons:</strong></p>
              <div className="mt-2 space-y-1">
                <p>Control vs Treatment A (Pre): p = {pValues['pre_control_vs_treatment']?.toFixed(4) || 'N/A'}</p>
                <p>Control vs Treatment A (Post): p = {pValues['post_control_vs_treatment']?.toFixed(4) || 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}