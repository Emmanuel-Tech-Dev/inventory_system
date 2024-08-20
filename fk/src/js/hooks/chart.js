import React, { memo, useMemo, useState } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    Title,
    Tooltip,
    Legend, 
    ArcElement  
} from 'chart.js';
import { Bar, Pie, Doughnut, Line } from 'react-chartjs-2';
import ChartDataLabels from 'chartjs-plugin-datalabels';

function useChart(theTitle = '', theLegendPosition = 'top', theOptions = {}, theLabels = []) {
    const [title, setTitle] = useState(theTitle || '');
    const [legendPosition, setLegendPosition] = useState(theLegendPosition || 'top');
    const [plugins, setPlugins] = useState([]);
    const allPlugins = { ChartDataLabels };
    const [options, setOptions] = useState(theOptions || {
        responsive: true,
        plugins: {
            legend: {
                position: legendPosition,
            },
            title: {
                display: true,
                text: theTitle || title || '',
            },
        },
    });

    const [data, setData] = useState({});

    useMemo(() => {
        ChartJS.register(
            CategoryScale,
            LinearScale,
            BarElement,
            LineElement,
            PointElement,
            Title,
            Tooltip,
            Legend,
            ArcElement
        );
    }, [data]);

    function BarChart(localData) {        
        if (localData && Object.keys(localData).length) {            
            return <Bar options={options} data={localData} plugins={plugins} />;
        } else if(data && Object.keys(data).length) {            
            return <Bar options={options} data={data} plugins={plugins} />;            
        } else {            
            return <></>;
        }        
    }

    function PieChart(localData) {        
        if (localData && Object.keys(localData).length) {                        
            return <Pie options={options} data={localData} plugins={plugins} />;
        } else if(data && Object.keys(data).length) {            
            return <Pie options={options} data={data} plugins={plugins} />;            
        } else {            
            return <></>;
        }        
    }

    function DoughnutChart(localData) {
        if (localData && Object.keys(localData).length) {            
            return <Doughnut options={options} data={localData} plugins={plugins} />;
        } else if(data && Object.keys(data).length) {            
            return <Doughnut options={options} data={data} plugins={plugins} />;            
        } else {            
            return <></>;
        }        
    }

    function LineChart(localData) {
        if (localData && Object.keys(localData).length) {            
            return <Line options={options} data={localData} plugins={plugins} />;
        } else if(data && Object.keys(data).length) {            
            return <Line options={options} data={data} plugins={plugins} />;            
        } else {            
            return <></>;
        }        
    }

    return { 
        PieChart, 
        DoughnutChart, 
        BarChart, 
        LineChart,
        options, 
        setOptions, 
        data, 
        setData, 
        title, 
        setTitle, 
        legendPosition, 
        setLegendPosition, 
        setPlugins, 
        plugins, 
        allPlugins 
    };
}

export default useChart;