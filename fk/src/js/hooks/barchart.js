import React, { memo, useMemo, useState } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import ChartDataLabels from 'chartjs-plugin-datalabels';

function useBarChart(theTitle = '', theLegendPosition = 'top', theOptions = {}, theLabels = []) {
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
            Title,
            Tooltip,
            Legend
        );


    }, [data]);


    function BarChart() {
        if(!Object.keys(data).length) return;  
        return <Bar options={options} data={data} plugins={plugins} />;
    }

    return { options, setOptions, data, setData, BarChart, title, setTitle, legendPosition, setLegendPosition, setPlugins, plugins, allPlugins }
}


export default useBarChart;