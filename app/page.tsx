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
  const [userThoughts, setUserThoughts] = useState<string>('');
  const [showGraphBox, setShowGraphBox] = useState(false);
  const [graphThoughts, setGraphThoughts] = useState<string>('');
  const [showResultsClicked, setShowResultsClicked] = useState(false);
  const [continueClicked, setContinueClicked] = useState(false);
  const [submitClicked, setSubmitClicked] = useState(false);
  const [showResultsPage, setShowResultsPage] = useState(false);
  const [activeTab, setActiveTab] = useState<'table' | 'graph'>('table');
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

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

  // Function to save submission to MongoDB
  const saveSubmission = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/submissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tableAnalysis: userThoughts,
          graphAnalysis: graphThoughts
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save submission');
      }
      
      // Fetch updated submissions after saving
      await fetchSubmissions();
    } catch (error) {
      console.error('Error saving submission:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Function to fetch last 30 submissions
  const fetchSubmissions = async () => {
    try {
      const response = await fetch('/api/submissions');
      if (response.ok) {
        const data = await response.json();
        setSubmissions(data.submissions || []);
      }
    } catch (error) {
      console.error('Error fetching submissions:', error);
    }
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

    setStatistics(newStatistics);
    setShowResults(true);
    
    // Scroll to bottom of page after results are shown
    setTimeout(() => {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    }, 100);
  };
  
  // Load submissions when results page is shown
  useEffect(() => {
    if (showResultsPage && submissions.length === 0) {
      fetchSubmissions();
    }
  }, [showResultsPage]);
  
  // Function to restart the application
  const restartApplication = () => {
    setShowResults(false);
    setStatistics({});
    setUserThoughts('');
    setShowGraphBox(false);
    setGraphThoughts('');
    setShowResultsClicked(false);
    setContinueClicked(false);
    setSubmitClicked(false);
    setShowResultsPage(false);
    setActiveTab('table');
    setSubmissions([]);
    setLoading(false);
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '20px auto 20px auto' }}>
      <div className="border border-black rounded-lg p-6 mb-8 bg-gray-100 shadow-sm" style={{backgroundColor: '#f3f4f6', border: '1px solid black', borderRadius: '8px', padding: '24px', marginBottom: '32px'}}>
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
          <button 
            className="button" 
            style={{
              ...newBaseButtonStyle,
              opacity: showResultsClicked ? 0.5 : 1,
              cursor: showResultsClicked ? 'not-allowed' : 'pointer'
            }}
            disabled={showResultsClicked}
            onClick={() => {
              calculateStatistics();
              setShowResultsClicked(true);
            }}
          >
            SHOW RESULTS
          </button>
        </div>
      </div>

      {showResults && (
        <div className="border border-black rounded-lg p-6 bg-gray-100 shadow-sm" style={{backgroundColor: '#f3f4f6', border: '1px solid black', borderRadius: '8px', padding: '24px'}}>
          <h2 className="text-xl font-bold mb-6 text-center">Statistical Results</h2>
          
          <div className="overflow-x-auto flex justify-center">
            <table className="border-collapse border border-gray-300" style={{border: '1px solid black', margin: '0 auto', width: '80%'}}>
              <thead>
                <tr className="bg-gray-100" style={{backgroundColor: '#6b7280'}}>
                  <th className="border border-gray-300 px-4 py-3 text-left font-semibold" style={{color: 'white', border: '1px solid black'}}>Condition</th>
                  <th className="border border-gray-300 px-4 py-3 text-center font-semibold" style={{color: 'white', border: '1px solid black'}}>Time</th>
                  <th className="border border-gray-300 px-4 py-3 text-center font-semibold" style={{color: 'white', border: '1px solid black'}}>Mean (seconds)</th>
                  <th className="border border-gray-300 px-4 py-3 text-center font-semibold" style={{color: 'white', border: '1px solid black'}}>SD (seconds)</th>
                  <th className="border border-gray-300 px-4 py-3 text-center font-semibold" style={{color: 'white', border: '1px solid black'}}>P-value</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(statistics).map(([key, stats]) => {
                  const parts = key.split('_');
                  let condition, time;
                  if (parts.length === 3 && parts[0] === 'treatment') {
                    // For treatment_A_pre or treatment_A_post
                    condition = 'treatment_A';
                    time = parts[2];
                  } else {
                    // For control_pre or control_post
                    condition = parts[0];
                    time = parts[1];
                  }
                  const conditionDisplay = condition === 'treatment_A' ? 'Treatment A' : 
                                         condition.charAt(0).toUpperCase() + condition.slice(1);
                  const timeDisplay = time; // Use actual time values from data
                  
                  // Get relevant p-value for this row using fixed values
                  let pValue: number | string | null = null;
                  
                  if (condition === 'control' && time === 'pre') {
                    pValue = 'NA';
                  } else if (condition === 'control' && time === 'post') {
                    pValue = 0.34230;
                  } else if (condition === 'treatment_A' && time === 'pre') {
                    pValue = 'NA';
                  } else if (condition === 'treatment_A' && time === 'post') {
                    pValue = 0.87741;
                  }
                  
                  const rowColor = time === 'pre' ? '#ff9966' : '#66cccc'; // Same colors as graph
                  
                  return (
                    <tr key={key} className="hover:bg-gray-50" style={{backgroundColor: rowColor}}>
                      <td className="border border-gray-300 px-4 py-3" style={{border: '1px solid black'}}>{conditionDisplay}</td>
                      <td className="border border-gray-300 px-4 py-3 text-center" style={{border: '1px solid black', textAlign: 'center'}}>{timeDisplay}</td>
                      <td className="border border-gray-300 px-4 py-3 text-center" style={{border: '1px solid black', textAlign: 'center'}}>{stats.mean.toFixed(5)}</td>
                      <td className="border border-gray-300 px-4 py-3 text-center" style={{border: '1px solid black', textAlign: 'center'}}>{stats.standardDeviation.toFixed(5)}</td>
                      <td className="border border-gray-300 px-4 py-3 text-center" style={{border: '1px solid black', textAlign: 'center'}}>
                        {pValue === 'NA' ? (
                          <span className="text-gray-400">NA</span>
                        ) : pValue !== null && typeof pValue === 'number' ? (
                          <span className={pValue < 0.05 ? 'text-red-600 font-semibold' : 'text-gray-700'}>
                            {pValue.toFixed(5)} {pValue < 0.05 ? '*' : ''}
                            <br />
                            <span className="text-xs text-gray-500"></span>
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
          </div>
          
          <div style={{ marginTop: '32px' }}>
            <h3 className="text-lg font-semibold mb-3">Your thoughts on the results:</h3>
            <textarea
              value={userThoughts}
              onChange={(e) => setUserThoughts(e.target.value)}
              placeholder="Enter your analysis and thoughts about the statistical results..."
              style={{
                width: '100%',
                minHeight: '120px',
                padding: '12px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '14px',
                fontFamily: 'inherit',
                resize: 'vertical'
              }}
            />
            
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
              <button 
                className="button" 
                style={{
                  ...newBaseButtonStyle,
                  opacity: (userThoughts.trim().length > 0 && !continueClicked) ? 1 : 0.5,
                  cursor: (userThoughts.trim().length > 0 && !continueClicked) ? 'pointer' : 'not-allowed'
                }}
                disabled={userThoughts.trim().length === 0 || continueClicked}
                onClick={() => {
                  // console.log('User thoughts:', userThoughts);
                  setShowGraphBox(true);
                  setContinueClicked(true);
                  // Scroll to the new box
                  setTimeout(() => {
                    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
                  }, 100);
                }}
              >
                CONTINUE
              </button>
            </div>
          </div>
        </div>
      )}
      
      {showGraphBox && (
        <div className="border border-black rounded-lg p-6 bg-gray-100 shadow-sm" style={{backgroundColor: '#f3f4f6', border: '1px solid black', borderRadius: '8px', padding: '24px', marginTop: '32px'}}>
          <h2 className="text-xl font-bold mb-6 text-center">Data Visualization</h2>
          
          <div style={{ marginBottom: '32px' }}>
            <h3 className="text-lg font-semibold mb-3">Instructions:</h3>
            <p className="text-gray-700 mb-4">Examine the graph below showing the data distribution. Consider the visual patterns, outliers, and how the graph supports or contradicts your statistical analysis.</p>
          </div>
          
          <div style={{ 
            backgroundColor: 'white', 
            border: '1px solid #ccc', 
            borderRadius: '8px', 
            padding: '20px', 
            marginBottom: '32px',
            minHeight: '300px'
          }}>
            <svg width="100%" height="320" viewBox="0 0 600 320">
              {/* Chart Title */}
              <text x="300" y="20" textAnchor="middle" fontSize="16" fontWeight="bold">Mean Values by Condition and Time</text>
              
              {/* Legend - Horizontal below title with more space */}
              <g transform="translate(220, 40)">
                <rect x="0" y="0" width="15" height="15" fill="#ff9966" stroke="#000"/>
                <text x="20" y="12" fontSize="12">Pre</text>
                <rect x="80" y="0" width="15" height="15" fill="#66cccc" stroke="#000"/>
                <text x="100" y="12" fontSize="12">Post</text>
              </g>
              
              {/* Y-axis label */}
              <text x="15" y="160" textAnchor="middle" fontSize="12" transform="rotate(-90 15 160)">Mean (seconds)</text>
              
              {/* X-axis label */}
              <text x="300" y="310" textAnchor="middle" fontSize="12">Conditions</text>
              
              {/* Y-axis ticks and labels */}
              {(() => {
                const minValue = 0;
                const maxValue = 120;
                const range = maxValue - minValue;
                const tickValues = [0, 30, 60, 90, 120];
                
                return tickValues.map((value, i) => {
                  const yPos = 230 - ((value - minValue) / range) * 150;
                  
                  return (
                    <g key={i}>
                      {/* Tick mark */}
                      <line x1="45" y1={yPos} x2="55" y2={yPos} stroke="#000" strokeWidth="1"/>
                      {/* Tick label */}
                      <text x="40" y={yPos + 4} textAnchor="end" fontSize="10">
                        {value}
                      </text>
                    </g>
                  );
                });
              })()}
              
              {/* Bars */}
              {(() => {
                // Group and sort data by condition
                const groupedData = [];
                const controlPre = Object.entries(statistics).find(([key]) => key === 'control_pre');
                const controlPost = Object.entries(statistics).find(([key]) => key === 'control_post');
                const treatmentPre = Object.entries(statistics).find(([key]) => key === 'treatment_A_pre');
                const treatmentPost = Object.entries(statistics).find(([key]) => key === 'treatment_A_post');
                
                if (controlPre) groupedData.push(controlPre);
                if (controlPost) groupedData.push(controlPost);
                if (treatmentPre) groupedData.push(treatmentPre);
                if (treatmentPost) groupedData.push(treatmentPost);
                
                const minValue = 0;
                const maxValue = 120;
                const range = maxValue - minValue;
                
                return groupedData.map(([key, stats], index) => {
                  const parts = key.split('_');
                  let condition, time;
                  if (parts.length === 3 && parts[0] === 'treatment') {
                    condition = 'Treatment A';
                    time = parts[2];
                  } else {
                    condition = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
                    time = parts[1];
                  }
                  
                  const barHeight = ((stats.mean - minValue) / range) * 150; // Scale relative to 0-130
                  const barWidth = 70;
                  
                  // Group bars: Control (0,1), Treatment A (2,3)
                  const groupIndex = Math.floor(index / 2);
                  const barInGroup = index % 2;
                  const xPos = 100 + (groupIndex * 180) + (barInGroup * 70); // Bars touch within group
                  const yPos = 230 - barHeight;
                  
                  const barColor = time === 'pre' ? '#ff9966' : '#66cccc'; // Light orange for pre, light aquamarine for post
                  
                  return (
                    <g key={key}>
                      {/* Bar */}
                      <rect
                        x={xPos}
                        y={yPos}
                        width={barWidth}
                        height={barHeight}
                        fill={barColor}
                        stroke="#000"
                        strokeWidth="1"
                      />
                      
                      {/* Value label on top of bar */}
                      <text
                        x={xPos + barWidth/2}
                        y={yPos - 5}
                        textAnchor="middle"
                        fontSize="10"
                        fontWeight="bold"
                      >
                        {stats.mean.toFixed(1)}
                      </text>
                      
                      {/* Condition label (only show once per group) */}
                      {barInGroup === 0 && (
                        <text
                          x={xPos + barWidth}
                          y={250}
                          textAnchor="middle"
                          fontSize="12"
                          fontWeight="bold"
                        >
                          {condition}
                        </text>
                      )}
                      
                      {/* Time label under each bar */}
                      <text
                        x={xPos + barWidth/2}
                        y={265}
                        textAnchor="middle"
                        fontSize="10"
                        fill="#666"
                      >
                        {time}
                      </text>
                    </g>
                  );
                });
              })()}
              
              {/* Y-axis */}
              <line x1="50" y1="80" x2="50" y2="230" stroke="#000" strokeWidth="2"/>
              
              {/* X-axis */}
              <line x1="50" y1="230" x2="550" y2="230" stroke="#000" strokeWidth="2"/>
            </svg>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-3">Your analysis of the graph:</h3>
            <textarea
              value={graphThoughts}
              onChange={(e) => setGraphThoughts(e.target.value)}
              placeholder="Describe what you observe in the graph and how it relates to your statistical findings..."
              style={{
                width: '100%',
                minHeight: '120px',
                padding: '12px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '14px',
                fontFamily: 'inherit',
                resize: 'vertical'
              }}
            />
            
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
              <button 
                className="button" 
                style={{
                  ...newBaseButtonStyle,
                  opacity: (graphThoughts.trim().length > 0 && !submitClicked) ? 1 : 0.5,
                  cursor: (graphThoughts.trim().length > 0 && !submitClicked) ? 'pointer' : 'not-allowed'
                }}
                disabled={graphThoughts.trim().length === 0 || submitClicked}
                onClick={async () => {
                  // console.log('Graph thoughts:', graphThoughts);
                  setSubmitClicked(true);
                  setShowResultsPage(true);
                  
                  // Save to MongoDB and fetch existing submissions
                  await saveSubmission();
                  
                  // Scroll to the new results page
                  setTimeout(() => {
                    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
                  }, 100);
                }}
              >
                SUBMIT
              </button>
            </div>
          </div>
        </div>
      )}
      
      {showResultsPage && (
        <div className="border border-black rounded-lg p-6 bg-gray-100 shadow-sm" style={{backgroundColor: '#f3f4f6', border: '1px solid black', borderRadius: '8px', padding: '24px', marginTop: '32px'}}>
          <h2 className="text-xl font-bold mb-6 text-center">Results & Analysis</h2>
          
          <div style={{ marginBottom: '32px' }}>
            <h3 className="text-lg font-semibold mb-4">Difference in Nominal Significance (DINS) Error</h3>
            <div className="text-gray-700 leading-relaxed" style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', border: '1px solid #ccc' }}>
              <p className="mb-3">
                The <strong>Difference in Nominal Significance (DINS)</strong> error occurs when researchers incorrectly conclude that two treatments have different effects based solely on the fact that one treatment shows a statistically significant result (p &lt; 0.05) while the other does not.
              </p>
              <p className="mb-3">
                This error is problematic because the absence of statistical significance in one group does not necessarily mean that group differs from a group that does show significance. To properly compare treatments, researchers should directly compare the two groups rather than comparing each group&apos;s significance status.
              </p>
              <p>
                In your analysis, both conditions showed non-significant results (Control: p = 0.34230, Treatment A: p = 0.87741), but it would still be incorrect to conclude they are equivalent without proper comparative statistical testing.
              </p>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">User Submission Analysis</h3>
            
            {/* Tab Interface */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', borderBottom: '2px solid #ccc' }}>
                <button
                  onClick={() => setActiveTab('table')}
                  style={{
                    padding: '12px 24px',
                    border: 'none',
                    backgroundColor: activeTab === 'table' ? '#4a5568' : '#e2e8f0',
                    color: activeTab === 'table' ? 'white' : '#4a5568',
                    cursor: 'pointer',
                    borderRadius: '8px 8px 0 0',
                    fontWeight: 'bold',
                    marginRight: '4px'
                  }}
                >
                  Statistical Table Analysis
                </button>
                <button
                  onClick={() => setActiveTab('graph')}
                  style={{
                    padding: '12px 24px',
                    border: 'none',
                    backgroundColor: activeTab === 'graph' ? '#4a5568' : '#e2e8f0',
                    color: activeTab === 'graph' ? 'white' : '#4a5568',
                    cursor: 'pointer',
                    borderRadius: '8px 8px 0 0',
                    fontWeight: 'bold'
                  }}
                >
                  Graph Analysis
                </button>
              </div>
            </div>
            
            {/* Tab Content */}
            <div style={{ 
              backgroundColor: 'white', 
              border: '1px solid #ccc', 
              borderRadius: '0 8px 8px 8px', 
              padding: '20px',
              minHeight: '300px'
            }}>
              {activeTab === 'table' && (
                <div>
                  <h4 className="text-md font-semibold mb-3">Analysis Object: Statistical Results Table</h4>
                  {loading ? (
                    <div style={{ textAlign: 'center', padding: '20px' }}>Loading submissions...</div>
                  ) : (
                    <div style={{ border: '1px solid black', borderRadius: '4px' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                          <tr style={{ backgroundColor: '#6b7280' }}>
                            <th style={{ border: '1px solid black', padding: '12px', textAlign: 'left', fontWeight: 'bold', color: 'white' }}>User Analysis</th>
                          </tr>
                        </thead>
                      </table>
                      <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                          <tbody>
                            {submissions.length > 0 ? (
                              submissions.map((submission) => (
                                <tr key={submission._id}>
                                  <td style={{ border: '1px solid black', borderTop: 'none', padding: '12px', verticalAlign: 'top', whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}>{submission.tableAnalysis}</td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td style={{ border: '1px solid black', borderTop: 'none', padding: '12px', textAlign: 'center', fontStyle: 'italic' }}>No submissions yet</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                  
                  <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
                    <button 
                      className="button" 
                      style={newBaseButtonStyle}
                      onClick={restartApplication}
                    >
                      START OVER
                    </button>
                  </div>
                </div>
              )}
              
              {activeTab === 'graph' && (
                <div>
                  <h4 className="text-md font-semibold mb-3">Analysis Object: Bar Chart Visualization</h4>
                  {loading ? (
                    <div style={{ textAlign: 'center', padding: '20px' }}>Loading submissions...</div>
                  ) : (
                    <div style={{ border: '1px solid black', borderRadius: '4px' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                          <tr style={{ backgroundColor: '#6b7280' }}>
                            <th style={{ border: '1px solid black', padding: '12px', textAlign: 'left', fontWeight: 'bold', color: 'white' }}>User Analysis</th>
                          </tr>
                        </thead>
                      </table>
                      <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                          <tbody>
                            {submissions.length > 0 ? (
                              submissions.map((submission) => (
                                <tr key={submission._id}>
                                  <td style={{ border: '1px solid black', borderTop: 'none', padding: '12px', verticalAlign: 'top', whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}>{submission.graphAnalysis}</td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td style={{ border: '1px solid black', borderTop: 'none', padding: '12px', textAlign: 'center', fontStyle: 'italic' }}>No submissions yet</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                  
                  <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
                    <button 
                      className="button" 
                      style={newBaseButtonStyle}
                      onClick={restartApplication}
                    >
                      START OVER
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}