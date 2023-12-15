import { createObjectCsvWriter } from 'csv-writer'

const headersByModule = {
    gm: [
        {id: "n", title: "#"},
        {id: "wallet", title: "wallet"},
        {id: "gm", title: "gm"},
        {id: "daily", title: "daily"},
    ],
    task: [
        {id: "n", title: "#"},
        {id: "wallet", title: "wallet"},
        {id: "success", title: "success"},
    ],
}

