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
  standardError: number;
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
  const [showAnovaTable, setShowAnovaTable] = useState(false);

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

  const calculateStandardError = (standardDeviation: number, count: number): number => {
    return standardDeviation / Math.sqrt(count);
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
      const standardError = calculateStandardError(standardDeviation, values.length);
      newStatistics[key] = {
        mean,
        standardDeviation,
        standardError,
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
  }, [showResultsPage, submissions.length]);
  
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
    setShowAnovaTable(false);
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  return (
    <div style={{ padding: '20px', maxWidth: '80%', margin: '20px auto' }}>
      <div style={{ backgroundColor: '#f3f4f6', border: '1px solid black', borderRadius: '8px', padding: '24px', marginBottom: '32px' }}>
        <div style={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '24px', display: 'flex', flexDirection: 'column' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '16px' }}>Does Compound A improve motor coordination in a mouse model of Amyotrophic Lateral Sclerosis?</h2>
          
          <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '12px' }}>Study Description</h3>
          <p style={{ color: '#374151', marginBottom: '24px', lineHeight: '1.6' }}>
            A research team is assessing the efficacy of Compound A on improving motor coordination in an ALS (amyotrophic lateral sclerosis) model mouse. A Treatment group administered compound A is compared with a targeted negative Control group treated with vehicle D. The team assesses motor coordination using a standardized rotarod test with a max time of 180 sec.
          </p>
          
          {/* <h3>Likely value range for dependent variable with units:</h3>
          <div>
            <p>0-180 seconds (rotarod performance).</p>
            <p>180 (control)</p>
            <p>80-140 (ALS)</p>
          </div> */}
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
        <div style={{ backgroundColor: '#f3f4f6', border: '1px solid black', borderRadius: '8px', padding: '24px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '24px', textAlign: 'center' }}>Statistical Results</h2>
          
          <div style={{ overflowX: 'auto', display: 'flex', justifyContent: 'center' }}>
            <table style={{ borderCollapse: 'collapse', border: '1px solid black', margin: '0 auto', width: '90%' }}>
              <thead>
                <tr style={{ backgroundColor: '#6b7280' }}>
                  <th style={{ border: '1px solid black', padding: '12px', textAlign: 'left', fontWeight: '600', color: 'white' }}>Group</th>
                  <th style={{ border: '1px solid black', padding: '12px', textAlign: 'center', fontWeight: '600', color: 'white' }}>Pre-training Mean (SE)</th>
                  <th style={{ border: '1px solid black', padding: '12px', textAlign: 'center', fontWeight: '600', color: 'white' }}>Post-training Mean (SE)</th>
                  <th style={{ border: '1px solid black', padding: '12px', textAlign: 'center', fontWeight: '600', color: 'white' }}>p-value</th>
                  <th style={{ border: '1px solid black', padding: '12px', textAlign: 'center', fontWeight: '600', color: 'white' }}>Significance (p&lt;0.05)</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  // Group data by condition for the new table format
                  const groupedStats: Record<string, {pre?: any, post?: any}> = {};
                  
                  Object.entries(statistics).forEach(([key, stats]) => {
                    const parts = key.split('_');
                    let condition: string;
                    let time: 'pre' | 'post';
                    
                    if (parts.length === 3 && parts[0] === 'treatment') {
                      condition = 'treatment_A';
                      time = parts[2] as 'pre' | 'post';
                    } else {
                      condition = parts[0];
                      time = parts[1] as 'pre' | 'post';
                    }
                    
                    if (!groupedStats[condition]) {
                      groupedStats[condition] = {};
                    }
                    groupedStats[condition][time] = stats;
                  });
                  
                  return Object.entries(groupedStats).map(([condition, timeStats]) => {
                    const conditionDisplay = condition === 'treatment_A' ? 'Treatment' : 'Control';
                    
                    // Get p-value for post-training comparison
                    let pValue: number | string = condition === 'control' ? 0.14142 : 0.00217;
                    
                    // Determine significance
                    const isSignificant = typeof pValue === 'number' && pValue < 0.05;
                    const significanceText = isSignificant ? 'Significant*' : 'Not significant';
                    
                    return (
                      <tr key={condition}>
                        <td style={{ border: '1px solid black', padding: '12px' }}>{conditionDisplay}</td>
                        <td style={{ border: '1px solid black', padding: '12px', textAlign: 'center' }}>
                          {timeStats.pre ? `${timeStats.pre.mean.toFixed(1)} (${timeStats.pre.standardError.toFixed(1)})` : 'N/A'}
                        </td>
                        <td style={{ border: '1px solid black', padding: '12px', textAlign: 'center' }}>
                          {timeStats.post ? `${timeStats.post.mean.toFixed(1)} (${timeStats.post.standardError.toFixed(1)})` : 'N/A'}
                        </td>
                        <td style={{ border: '1px solid black', padding: '12px', textAlign: 'center' }}>
                          <span style={{ color: '#374151', fontWeight: 'normal' }}>
                            {typeof pValue === 'number' ? pValue.toFixed(5) : pValue}
                          </span>
                        </td>
                        <td style={{ border: '1px solid black', padding: '12px', textAlign: 'center' }}>
                          <span style={{ fontWeight: isSignificant ? '600' : 'normal' }}>
                            {significanceText}
                          </span>
                        </td>
                      </tr>
                    );
                  });
                })()}
              </tbody>
            </table>
          </div>
          
          <div style={{ marginTop: '32px' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '12px' }}>Review the statistical table. How do you interpret the results of the study?</h3>
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
                  setShowGraphBox(true);
                  setContinueClicked(true);
                  setTimeout(() => {
                    const dataVizElement = document.getElementById('data-visualization');
                    if (dataVizElement) {
                      const rect = dataVizElement.getBoundingClientRect();
                      const absoluteTop = window.pageYOffset + rect.top - 65;
                      window.scrollTo({
                        top: absoluteTop,
                        behavior: 'smooth'
                      });
                    }
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
        <div id="data-visualization" style={{ backgroundColor: '#f3f4f6', border: '1px solid black', borderRadius: '8px', padding: '24px', marginTop: '32px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '24px', textAlign: 'center' }}>Data Visualization</h2>
          
          {/* <div style={{ marginBottom: '32px' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '12px' }}>More information has been added. Does this change how you interpret the results of the study?</h3>
            <p></p>
          </div> */}
          
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
                      
                      {/* Error bar */}
                      {(() => {
                        const errorBarHeight = ((stats.standardError) / range) * 150; // Scale SE to chart
                        const errorBarTop = yPos - errorBarHeight;
                        const errorBarBottom = yPos + errorBarHeight;
                        const errorBarWidth = barWidth * 0.5; // 50% overlap
                        const errorBarX = xPos + (barWidth - errorBarWidth) / 2;
                        
                        return (
                          <g>
                            {/* Main error bar line */}
                            <line
                              x1={xPos + barWidth/2}
                              y1={errorBarTop}
                              x2={xPos + barWidth/2}
                              y2={errorBarBottom}
                              stroke="#000"
                              strokeWidth="2"
                            />
                            {/* Top cap */}
                            <line
                              x1={errorBarX}
                              y1={errorBarTop}
                              x2={errorBarX + errorBarWidth}
                              y2={errorBarTop}
                              stroke="#000"
                              strokeWidth="2"
                            />
                            {/* Bottom cap */}
                            <line
                              x1={errorBarX}
                              y1={errorBarBottom}
                              x2={errorBarX + errorBarWidth}
                              y2={errorBarBottom}
                              stroke="#000"
                              strokeWidth="2"
                            />
                          </g>
                        );
                      })()}
                      
                      {/* Value label on top of error bar */}
                      <text
                        x={xPos + barWidth/2}
                        y={yPos - ((stats.standardError / range) * 150) - 10}
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
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '12px' }}>More information has been added. Does this change how you interpret the results of the study?</h3>
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
                  
                  // Scroll to the Results & Analysis section
                  setTimeout(() => {
                    const resultsElement = document.getElementById('results-analysis');
                    if (resultsElement) {
                      const rect = resultsElement.getBoundingClientRect();
                      const absoluteTop = window.pageYOffset + rect.top - 65; // 65px above to show full top
                      window.scrollTo({
                        top: absoluteTop,
                        behavior: 'smooth'
                      });
                    }
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
        <div id="results-analysis" style={{ backgroundColor: '#f3f4f6', border: '1px solid black', borderRadius: '8px', padding: '24px', marginTop: '32px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '24px', textAlign: 'center' }}>Results & Analysis</h2>
          
          <div style={{ marginBottom: '32px' }}>
            <div style={{ 
              backgroundColor: 'white', 
              padding: '32px', 
              borderRadius: '8px', 
              border: '1px solid #ccc', 
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              display: 'flex',
              flexDirection: 'column',
              gap: '32px'
            }}>
              {/* DINS Error Description */}
              <div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '16px' }}>Difference in Nominal Significance (DINS) Error</h3>
                <div style={{ color: 'black', lineHeight: '1.6', width: '100%' }}>
                  <p style={{ marginBottom: '12px' }}>
                    A Difference in Nominal Significance (DINS) error occurs when researchers wrongly conclude that two treatments have different effects because one treatment shows a statistically significant result when comparing pre- and post- measurements while the other does not.
                  </p>
                  <p style={{ marginBottom: '12px' }}>
                    This error is problematic because a difference in significance is not a significant difference. Statistical tests within each group do not test whether the changes within that group differ from the other group.
                  </p>
                  <p>
                    One way to compare treatments in a case like this would be to use a repeated-measures ANOVA. In addition to separate comparisons of time (pre vs post) and treatment (treatment vs control), this test gives us an interaction term, testing whether the change over time differed between treatment and control groups. The interaction term answers our question, telling us that in this case the effect of treatment on performance was not significantly different between groups (p = 0.960732).
                  </p>
                </div>
              </div>

              {/* ANOVA Table Toggle */}
              <div>
                <button 
                  className="button"
                  onClick={() => setShowAnovaTable(!showAnovaTable)}
                  style={{
                    ...newBaseButtonStyle,
                    marginBottom: '16px'
                  }}
                >
                  {showAnovaTable ? 'Click to hide the complete ANOVA table.' : 'Click to review the complete ANOVA table.'}
                </button>
                
                {showAnovaTable && (
                  <div>
                    <h4 style={{ fontFamily: 'General Sans, sans-serif', fontSize: '18px', fontWeight: 'bold', marginBottom: '24px', textAlign: 'center', color: '#333' }}>
                      Univariate Type III Repeated-Measures ANOVA Assuming Sphericity
                    </h4>
                    
                    <div style={{ 
                      fontFamily: 'JetBrains Mono, monospace', 
                      fontSize: '15px', 
                      backgroundColor: '#f8f9fa', 
                      padding: '24px', 
                      borderRadius: '8px', 
                      border: '1px solid #e9ecef',
                      boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.05)',
                      overflow: 'auto'
                    }}>
                      <table style={{ 
                        width: '100%', 
                        borderCollapse: 'separate', 
                        borderSpacing: '0 8px',
                        fontFamily: 'JetBrains Mono, monospace'
                      }}>
                        <thead>
                          <tr style={{ borderBottom: '2px solid #dee2e6' }}>
                            <th style={{ textAlign: 'left', padding: '8px 16px', fontWeight: 'bold', fontSize: '14px' }}></th>
                            <th style={{ textAlign: 'right', padding: '8px 16px', fontWeight: 'bold', fontSize: '14px', cursor: 'help' }} title="Sum of Squares is the variability in the dependent variable that can be attributed to the independent variable. Higher sum of squares means the independent variable has more influence.">Sum Sq</th>
                            <th style={{ textAlign: 'right', padding: '8px 16px', fontWeight: 'bold', fontSize: '14px', cursor: 'help' }} title="Numerator degrees of freedom is one less than the number of groups being compared.">num Df</th>
                            <th style={{ textAlign: 'right', padding: '8px 16px', fontWeight: 'bold', fontSize: '14px', cursor: 'help' }} title="Error Sum of Squares is the unexplained variability in the dependent variable for subjects across time points.">Error SS</th>
                            <th style={{ textAlign: 'right', padding: '8px 16px', fontWeight: 'bold', fontSize: '14px', cursor: 'help' }} title="Denominator degrees of freedom is the sample size minus the number of groups.">den Df</th>
                            <th style={{ textAlign: 'right', padding: '8px 16px', fontWeight: 'bold', fontSize: '14px', cursor: 'help' }} title="F ratio is the test statistic for the ANOVA, and is the ratio of sum of squares to the error sum of squares. This value is compared to expected values for the degrees of freedom in the numerator and denominator to determine a p-value.">F value</th>
                            <th style={{ textAlign: 'right', padding: '8px 16px', fontWeight: 'bold', fontSize: '14px', cursor: 'help' }} title="The 'p-value' is the probability of getting the F statistic in question if the null hypothesis ('no effect') were true.">Pr(&gt;F)</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr style={{ backgroundColor: '#f8f9fa' }}>
                            <td style={{ padding: '8px 16px', fontWeight: 'bold', cursor: 'help' }} title="This tests whether the overall means are different between treatment and control groups. They are not.">condition</td>
                            <td style={{ textAlign: 'right', padding: '8px 16px' }}>169</td>
                            <td style={{ textAlign: 'right', padding: '8px 16px' }}>1</td>
                            <td style={{ textAlign: 'right', padding: '8px 16px' }}>13331.0</td>
                            <td style={{ textAlign: 'right', padding: '8px 16px' }}>14</td>
                            <td style={{ textAlign: 'right', padding: '8px 16px' }}>0.1770</td>
                            <td style={{ textAlign: 'right', padding: '8px 16px' }}>0.680340</td>
                          </tr>
                          <tr style={{ backgroundColor: '#ffffff' }}>
                            <td style={{ padding: '8px 16px', fontWeight: 'bold', cursor: 'help' }} title="This tests whether the overall means are different between pre- and post- measurements. They are! However, this test is probably significant because both treatment and control mice improved.">time</td>
                            <td style={{ textAlign: 'right', padding: '8px 16px' }}>1795</td>
                            <td style={{ textAlign: 'right', padding: '8px 16px' }}>1</td>
                            <td style={{ textAlign: 'right', padding: '8px 16px' }}>2634.8</td>
                            <td style={{ textAlign: 'right', padding: '8px 16px' }}>14</td>
                            <td style={{ textAlign: 'right', padding: '8px 16px' }}>9.5351</td>
                            <td style={{ textAlign: 'right', padding: '8px 16px' }}>0.008023 **</td>
                          </tr>
                          <tr style={{ backgroundColor: '#f8f9fa', color: 'red' }}>
                            <td style={{ padding: '8px 16px', fontWeight: 'bold', color: 'red', cursor: 'help' }} title="This interaction term tests whether the difference between time points is different between groups. This answers our question: the effect of time does not differ between treatment and control.">condition:time</td>
                            <td style={{ textAlign: 'right', padding: '8px 16px', color: 'red' }}>0</td>
                            <td style={{ textAlign: 'right', padding: '8px 16px', color: 'red' }}>1</td>
                            <td style={{ textAlign: 'right', padding: '8px 16px', color: 'red' }}>2634.8</td>
                            <td style={{ textAlign: 'right', padding: '8px 16px', color: 'red' }}>14</td>
                            <td style={{ textAlign: 'right', padding: '8px 16px', color: 'red' }}>0.0025</td>
                            <td style={{ textAlign: 'right', padding: '8px 16px', color: 'red' }}>0.960732</td>
                          </tr>
                        </tbody>
                      </table>
                      
                      <div style={{ 
                        borderTop: '1px solid #dee2e6', 
                        paddingTop: '16px', 
                        marginTop: '16px',
                        fontSize: '13px',
                        color: '#666'
                      }}>
                        ---
                      </div>
                      
                      <div style={{ 
                        fontSize: '13px', 
                        marginTop: '12px',
                        fontStyle: 'italic',
                        color: '#666'
                      }}>
                        Signif. codes: 0 &apos;***&apos; 0.001 &apos;**&apos; 0.01 &apos;*&apos; 0.05 &apos;.&apos; 0.1 &apos; &apos; 1
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <div style={{ marginTop: '16px' }}>
                <div style={{ fontSize: '1rem', color: 'black', lineHeight: '1.6', width: '100%' }}>
                  <p style={{ marginBottom: '12px' }}>
                    If you would like to learn more about these kinds of errors in research, check out these references:
                  </p>
                  <p style={{ marginBottom: '12px' }}>
                    Bland, J. M., & Altman, D. G. (2015). Best (but oft forgotten) practices: Testing for treatment effects in randomized trials by separate analyses of changes from baseline in each group is a misleading approach. The American Journal of Clinical Nutrition, 102(5), 991–994. https://doi.org/10.3945/ajcn.115.119768
                  </p>
                  <p>
                    Nieuwenhuis, S., Forstmann, B. U., & Wagenmakers, E.-J. (2011). Erroneous analyses of interactions in neuroscience: A problem of significance. Nature Neuroscience, 14(9), 1105–1107. https://doi.org/10.1038/nn.2886
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '16px' }}>Responses</h3>
            
            {/* Tab Interface */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', borderBottom: '2px solid #d1d5db' }}>
                <button
                  onClick={() => setActiveTab('table')}
                  style={{
                    padding: '12px 24px',
                    border: 'none',
                    cursor: 'pointer',
                    borderTopLeftRadius: '8px',
                    borderTopRightRadius: '8px',
                    fontWeight: 'bold',
                    marginRight: '4px',
                    fontSize: '1rem',
                    backgroundColor: activeTab === 'table' ? '#4a5568' : '#e2e8f0',
                    color: activeTab === 'table' ? 'white' : '#4a5568'
                  }}
                >
                  Statistical Table
                </button>
                <button
                  onClick={() => setActiveTab('graph')}
                  style={{
                    padding: '12px 24px',
                    border: 'none',
                    cursor: 'pointer',
                    borderTopLeftRadius: '8px',
                    borderTopRightRadius: '8px',
                    fontWeight: 'bold',
                    fontSize: '1rem',
                    backgroundColor: activeTab === 'graph' ? '#4a5568' : '#e2e8f0',
                    color: activeTab === 'graph' ? 'white' : '#4a5568'
                  }}
                >
                  Graph with Error Bars
                </button>
              </div>
            </div>
            
            {/* Tab Content */}
            <div style={{ backgroundColor: 'white', border: '1px solid #d1d5db', borderBottomLeftRadius: '8px', borderBottomRightRadius: '8px', borderTopRightRadius: '8px', padding: '20px', minHeight: '300px' }}>
              {activeTab === 'table' && (
                <div>
                  {loading ? (
                    <div style={{ textAlign: 'center', padding: '20px' }}>Loading submissions...</div>
                  ) : (
                    <div style={{ border: '1px solid black', borderRadius: '4px' }}>
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
                  {loading ? (
                    <div style={{ textAlign: 'center', padding: '20px' }}>Loading submissions...</div>
                  ) : (
                    <div style={{ border: '1px solid black', borderRadius: '4px' }}>
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