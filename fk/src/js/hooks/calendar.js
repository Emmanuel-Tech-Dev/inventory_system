

import React, { useState, useMemo } from 'react';
import utils from '../dependencies/custom/react-utilities';
import Settings from '../dependencies/custom/settings';
import { Calendar, Col, Radio, Row, Select, Typography } from 'antd';
import dayjs from 'dayjs';
import SettingsStore from '../store/settings-store';
import ValuesStore from '../store/values-store';


const useCalendar = () => {
    const [selectedDate, setSelectedDate] = useState('');
    const [mode, setMode] = useState('');
    const [panelChangedDate, setPanelChangedDate] = useState('');

    useMemo(() => {

    }, []);

    const onPanelChange = (value, mode) => {
        setMode(mode);
        setPanelChangedDate(value.format('YYYY-MM-DD'));
    };
    const onSelect = (newValue) => {
        setSelectedDate(dayjs(newValue))
    };

    function isWeekend(date) {
        let dayOfWeek = new Date(date).getDay();
        return (dayOfWeek === 6) || (dayOfWeek === 0); // 6 = Saturday, 0 = Sunday
    }

    function isSomeDisabledWeekDay(date, daysToDisable) {
        if (!daysToDisable) return false;
        let dayOfWeek = new Date(date).getDay();
        if (daysToDisable?.includes(parseInt(dayOfWeek).toString())) {
            return true;
        }
        return false;
    }

    function calendarRange(yearStart, yearBefore, yearAfter, disabledDays = [], disableWeekends = true, range = { from: '', to: '' }, weekDayToDisable) {
        yearBefore = parseInt(yearBefore);
        yearAfter = parseInt(yearAfter);
        if (!range.from && !range.to) { return ('Range [from, to ] are missing'); }
        return <Calendar
            disabledDate={(date) => {//disable dates that are out of range,weekends,specifically disabled and past dates
                if (disableWeekends) {
                    if (!(date.endOf('d').valueOf() >= new Date(range.from).valueOf() && date.endOf('d').valueOf() <= new Date(range.to).valueOf())
                        || isWeekend(date) || isSomeDisabledWeekDay(date, weekDayToDisable) || disabledDays.includes(utils.formatDate(date)) || date.endOf('d').valueOf() < new Date().valueOf()) {
                        return true;
                    }
                    return false;
                } else {//disable dates that are out of range,specifically disabled and past dates
                    if (!(date.endOf('d').valueOf() >= new Date(range.from).valueOf() && date.endOf('d').valueOf() <= new Date(range.to).valueOf())
                        || isSomeDisabledWeekDay(date, weekDayToDisable) || disabledDays.includes(utils.formatDate(date)) || date.endOf('d').valueOf() < new Date().valueOf()) {
                        return true;
                    }
                    return false;
                }
            }}
            fullscreen={false}
            headerRender={({ value, type, onChange, onTypeChange }) => {
                const start = 0;
                const end = 12;
                const monthOptions = [];
                let current = value.clone();
                const localeData = value.localeData();
                const months = [];
                for (let i = 0; i < 12; i++) {
                    current = current.month(i);
                    months.push(localeData.monthsShort(current));
                }
                for (let i = start; i < end; i++) {
                    monthOptions.push(
                        <Select.Option key={i} value={i} className="month-item">
                            {months[i]}
                        </Select.Option>,
                    );
                }
                const year = value.year();
                const month = value.month();
                const options = [];
                for (let i = yearStart - yearBefore; i < yearStart + yearAfter; i += 1) {
                    options.push(
                        <Select.Option key={i} value={i} className="year-item">
                            {i}
                        </Select.Option>,
                    );
                }
                return (
                    <div
                        style={{
                            padding: 8,
                        }}
                    >
                        <Typography.Title level={4}>Calendar</Typography.Title>
                        <Row gutter={8}>
                            <Col>
                                <Radio.Group
                                    size="small"
                                    onChange={(e) => onTypeChange(e.target.value)}
                                    value={type}
                                >
                                    <Radio.Button value="month">Month</Radio.Button>
                                    <Radio.Button value="year">Year</Radio.Button>
                                </Radio.Group>
                            </Col>
                            <Col>
                                <Select
                                    size="small"
                                    dropdownMatchSelectWidth={false}
                                    className="my-year-select"
                                    value={year}
                                    onChange={(newYear) => {
                                        const now = value.clone().year(newYear);
                                        onChange(now);
                                    }}
                                >
                                    {options}
                                </Select>
                            </Col>
                            <Col>
                                <Select
                                    size="small"
                                    dropdownMatchSelectWidth={false}
                                    value={month}
                                    onChange={(newMonth) => {
                                        const now = value.clone().month(newMonth);
                                        onChange(now);
                                    }}
                                >
                                    {monthOptions}
                                </Select>
                            </Col>
                        </Row>
                    </div>
                );
            }}
            onPanelChange={onPanelChange}
            onSelect={onSelect}
        />
    }

    function calendar(yearStart, yearBefore, yearAfter, disabledDays = [], disableWeekends = true, weekDayToDisable) {
        yearBefore = parseInt(yearBefore);
        yearAfter = parseInt(yearAfter);
        return <Calendar
            disabledDate={(date) => {
                if (disableWeekends) {
                    if (date.endOf('d').valueOf() < new Date().valueOf() || isWeekend(date) || isSomeDisabledWeekDay(date, weekDayToDisable) || disabledDays.includes(utils.formatDate(date))) {
                        return true;
                    }
                    return false;
                } else {
                    if (date.endOf('d').valueOf() < new Date().valueOf() || isSomeDisabledWeekDay(date, weekDayToDisable) || disabledDays.includes(utils.formatDate(date))) {
                        return true;
                    }
                    return false;
                }
            }}
            fullscreen={false}
            headerRender={({ value, type, onChange, onTypeChange }) => {
                const start = 0;
                const end = 12;
                const monthOptions = [];
                let current = value.clone();
                const localeData = value.localeData();
                const months = [];
                for (let i = 0; i < 12; i++) {
                    current = current.month(i);
                    months.push(localeData.monthsShort(current));
                }
                for (let i = start; i < end; i++) {
                    monthOptions.push(
                        <Select.Option key={i} value={i} className="month-item">
                            {months[i]}
                        </Select.Option>,
                    );
                }
                const year = value.year();
                const month = value.month();
                const options = [];
                for (let i = yearStart - yearBefore; i < yearStart + yearAfter; i += 1) {
                    options.push(
                        <Select.Option key={i} value={i} className="year-item">
                            {i}
                        </Select.Option>,
                    );
                }
                return (
                    <div
                        style={{
                            padding: 8,
                        }}
                    >
                        <Typography.Title level={4}>Calendar</Typography.Title>
                        <Row gutter={8}>
                            <Col>
                                <Radio.Group
                                    size="small"
                                    onChange={(e) => onTypeChange(e.target.value)}
                                    value={type}
                                >
                                    <Radio.Button value="month">Month</Radio.Button>
                                    <Radio.Button value="year">Year</Radio.Button>
                                </Radio.Group>
                            </Col>
                            <Col>
                                <Select
                                    size="small"
                                    dropdownMatchSelectWidth={false}
                                    className="my-year-select"
                                    value={year}
                                    onChange={(newYear) => {
                                        const now = value.clone().year(newYear);
                                        onChange(now);
                                    }}
                                >
                                    {options}
                                </Select>
                            </Col>
                            <Col>
                                <Select
                                    size="small"
                                    dropdownMatchSelectWidth={false}
                                    value={month}
                                    onChange={(newMonth) => {
                                        const now = value.clone().month(newMonth);
                                        onChange(now);
                                    }}
                                >
                                    {monthOptions}
                                </Select>
                            </Col>
                        </Row>
                    </div>
                );
            }}
            onPanelChange={onPanelChange}
            onSelect={onSelect}
        />
    }

    return { calendar, calendarRange, selectedDate, mode, panelChangedDate, isWeekend };
}

export default useCalendar;


