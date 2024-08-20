import React, { useState } from "react";
import { read, utils, writeFile } from 'xlsx';

const useExcel = () => {
    const [data, setData] = useState([]);

    const importXLSX = (file) => {
        return new Promise((resolve, reject) => {
            try {
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        const wb = read(event.target.result);
                        const sheets = wb.SheetNames;
                        if (sheets.length) {
                            const rows = utils.sheet_to_json(wb.Sheets[sheets[0]]);
                            resolve(rows);
                            setData(rows);
                        }
                    }
                    reader.readAsArrayBuffer(file);
                }
            } catch (e) {
                reject(e);
            }
        });
    }

    const exportXLSX = (headings, data, sheetName, fileName) => {
        return new Promise((resolve, reject) => {
            try {
                const h = [headings];
                const wb = utils.book_new();
                const ws = utils.json_to_sheet([]);
                utils.sheet_add_aoa(ws, h);
                utils.sheet_add_json(ws, data, { origin: 'A2', skipHeader: true });
                utils.book_append_sheet(wb, ws, sheetName);
                writeFile(wb, fileName);
                resolve(true);
            } catch (e) {
                reject(e);
            }
        });
    }

    return { exportXLSX, importXLSX, setData, data };
};

export default useExcel;
