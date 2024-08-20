import React from "react";
import { Page, Document, StyleSheet, View, Text,PDFViewer } from "@react-pdf/renderer";

const styles = StyleSheet.create({
    page: {
        fontSize: 11,
        flexDirection: "column",
    },
    tableContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
    },
    row: {
        flexDirection: "row",
        alignItems: "center",
        border: '1px solid',
        padding: '2px',
        backgroundColor:'red',
        color:'white'
    },
    description: {
        width: "60%",
    },
    xyz: {
        width: "40%",
    },
});

const Table = ({ data, size, orientation, theStyle }) => (
    <PDFViewer width="500" height="300">
        <Document>
            <Page size="A4" style={styles.page}>
                <ItemsTable data={data} />
            </Page>
        </Document>
    </PDFViewer>
);

const ItemsTable = ({ data }) => (
    <View style={styles.tableContainer}>
        <TableRow items={data.items} />
    </View>
);

const TableRow = ({ items }) => {
    const rows = items.map((item) => (
        <View style={styles.row} key={item.sr.toString()}>
            <Text style={styles.description}>{item.desc}</Text>
            <Text style={styles.xyz}>{item.xyz}</Text>
        </View>
    ));
    return <>{rows}</>;
};

export { Table, ItemsTable, TableRow };
export default Table;