import { Configuration, OpenAIApi } from "openai";
import { useEffect, useState } from "react";


const pdfjsLib = require('pdfjs-dist/webpack');

// Set the location of the PDF.js worker script
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.8.335/pdf.worker.min.js';

export default function InvoiceRow({ file, index, parse, onInvoiceDataExtracted }) {
    const [parsing, setParsing] = useState(false);
    const [result, setResult] = useState();

    let done = false;

    const extractInvoiceData = async () => {
        if (done)   return;
        done = true;
        setParsing(true);
        const configuration = new Configuration({
            apiKey: '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',
        });
        delete configuration.baseOptions.headers['User-Agent'];

        const openai = new OpenAIApi(configuration);

        let extractedText = '';

        // Step 1: Read the uploaded PDF file
        const reader = new FileReader();
        reader.readAsArrayBuffer(file);

        // Step 2: Wait for the file to be loaded
        await new Promise((resolve) => {
            reader.onload = resolve;
        });

        const pdfBytes = reader.result;

        // Step 3: Load the PDF using pdfjs-dist
        const loadingTask = pdfjsLib.getDocument({ data: pdfBytes });
        const pdf = await loadingTask.promise;

        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            const page = await pdf.getPage(pageNum);
            const content = await page.getTextContent();
            const pageText = content.items.map(item => item.str).join(' ');
            extractedText += pageText;
        }

        const response = await openai.createCompletion({
            model: "text-davinci-003",
            prompt: `I need to extract invoice data from the given text. I need Provider Name as ProviderName, CIF, Invoice Date as InviceDate, Invoice Number as InvoiceNumber, Tax, Base Amount as BaseAmount, Total Amount as TotalAmount and Tax Rate as TaxRate in json. The json must be parsable with JavaScript. I want to the values in ". If Base Amount, Total Amount, and Tax is null or N/A or empty, I want it to be 0. And if Tax Rate is null or N/A, I want it to be 0% and the Base Amount is not 0. BaseAmount, TotalAmount, and Tax with currency, Also Tax is in not in percentage. All items and names must be string ` + "\n\n" + extractedText,
            temperature: 0.7,
            max_tokens: 700,
            top_p: 1,
            frequency_penalty: 0,
            presence_penalty: 0,
        });
        const res = response.data.choices[0].text;
        const firstIndex = res.indexOf('{');
        const lastIndex = res.lastIndexOf('}');
        console.log(res.substring(firstIndex, lastIndex + 1));
        try {
            const data = JSON.parse(res.substring(firstIndex, lastIndex + 1));
            setResult(data);
            onInvoiceDataExtracted(index, res.substring(firstIndex, lastIndex + 1));
        } catch (e) {

        }
        setParsing(false);
    }

    useEffect(() => {
        if (parse) {
            extractInvoiceData();
        }
    }, [parse])

    return (
        <div className="bg-white dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 border border-gray-200 rounded-lg shadow my-2 px-4 py-4 flex items-center h-[3rem]">
            {
                !result ? (
                    <>
                        <p className="w-1/12 text-left ml-4">{index + 1}</p>
                        <p className="grow text-left">
                            {file.name}
                        </p>

                        {parsing && (<div className='flex-none'>
                            <div role="status">
                                <svg aria-hidden="true" className="w-6 h-6 mr-2 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor" />
                                    <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill" />
                                </svg>
                            </div>
                        </div>)
                        }
                    </>
                ) : (
                    <>
                        <p className="w-1/12 text-left ml-4">{index + 1}</p>
                        <p className="w-4/12">{result["ProviderName"]}</p>
                        <p className="w-2/12">{result["CIF"]}</p>
                        <p className="w-2/12">{result["InvoiceDate"]}</p>
                        <p className="w-2/12">{result["InvoiceNumber"]}</p>
                        <p className="w-2/12">{result["TaxRate"]}</p>
                        <p className="w-2/12">{result["BaseAmount"]}</p>
                        <p className="w-2/12">{result["Tax"]}</p>
                        <p className="w-2/12">{result["TotalAmount"]}</p>
                    </>
                )
            }
        </div>
    )
}