import { Configuration, OpenAIApi } from "openai";
import { useEffect, useState } from "react";


const pdfjsLib = require('pdfjs-dist/webpack');

// Set the location of the PDF.js worker script
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.8.335/pdf.worker.min.js';

export default function SumRow({ data }) {
    return (
        <div className="bg-white dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 border border-gray-200 rounded-lg shadow my-2 px-4 py-4 flex items-center h-[3rem]">
            <p className="w-1/12 text-left ml-4"></p>
            <p className="w-4/12"></p>
            <p className="w-2/12"></p>
            <p className="w-2/12"></p>
            <p className="w-2/12"></p>
            <p className="w-2/12"></p>
            <p className="w-2/12">{data["BASum"]}</p>
            <p className="w-2/12">{data["TaxSum"]}</p>
            <p className="w-2/12">{data["TASum"]}</p>
        </div>
    )
}