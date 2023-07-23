import './App.css';
import InvoiceRow from './InvoiceRow';
import { useState } from 'react';
import Excel from 'exceljs';
import { saveAs } from 'file-saver';
import { Configuration, OpenAIApi } from 'openai';
import SumRow from './SumRow';

let invoiceData = [];
let sumString = "";

const columns = [
  { header: 'Provider Name', key: 'ProviderName' },
  { header: 'CIF', key: 'CIF' },
  { header: 'Invoice Date', key: 'InvoiceDate' },
  { header: 'Invoice Number', key: 'InvoiceNumber' },
  { header: 'Tax Rate', key: 'TaxRate' },
  { header: 'Base Amount', key: 'BaseAmount' },
  { header: 'Tax', key: 'Tax' },
  { header: 'Total Amount', key: 'TotalAmount' },
];

function App() {
  const [files, setFiles] = useState([]);
  const [parse, startParse] = useState(false);
  const [extractFinished, setExtractFinished] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sum, setSum] = useState();

  const workbook = new Excel.Workbook();

  const extractSum = async () => {
      const configuration = new Configuration({
          apiKey: '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',
      });
      delete configuration.baseOptions.headers['User-Agent'];

      const openai = new OpenAIApi(configuration);

      const response = await openai.createCompletion({
          model: "text-davinci-003",
          prompt: `give me the sum of BaseAmount as BASum, sum of Tax as TaxSum and sum of TotalAmount TASum from the given array in JSON Format` + "\n\n" + sumString,
          temperature: 0.7,
          max_tokens: 700,
          top_p: 1,
          frequency_penalty: 0,
          presence_penalty: 0,
      });
      const res = response.data.choices[0].text;
      const firstIndex = res.indexOf('{');
      const lastIndex = res.lastIndexOf('}');
      console.log(JSON.parse(res.substring(firstIndex, lastIndex + 1)));
      setSum(JSON.parse(res.substring(firstIndex, lastIndex + 1)));
  }

  const onInvoiceDataExtracted = (index, invoice) => {
    sumString += invoice + ",";
    invoiceData[index] = JSON.parse(invoice);
    let i;
    for (i = 0; i < invoiceData.length; i++) {
      if (!invoiceData[i]) return;
    }

    extractSum();

    setExtractFinished(true);
  }

  const exportToExcel = async () => {
    setSaving(true);
    try {

      const worksheet = workbook.addWorksheet("invoice");
      worksheet.columns = columns;
      worksheet.columns.forEach(column => {
        column.width = column.header.length + 5;
        column.alignment = { horizontal: 'center' };
      });
      invoiceData.forEach(singleData => {
        worksheet.addRow(singleData);
      });
      worksheet.addRow(["", "", "", "", "", sum["BASum"], sum["TaxSum"], sum["TASum"]]);
      const buf = await workbook.xlsx.writeBuffer();
      saveAs(new Blob([buf]), `1.xlsx`);

    } catch (e) {

    }
    setSaving(false);
  }

  return (
    <div className="App p-4">
      <div className='fixed w-1/4'>
        <div className="flex items-center justify-center w-full p-2">
          <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-bray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <svg className="w-8 h-8 mb-4 text-gray-500 dark:text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2" />
              </svg>
              <p className="mb-2 text-sm text-gray-500 dark:text-gray-400"><span className="font-semibold">Click to upload</span> or drag and drop</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">SVG, PNG, JPG or GIF (MAX. 800x400px)</p>
            </div>
            <input id="dropzone-file" type="file" className="hidden" multiple='multiple' accept=".pdf" onChange={async (e) => {
              startParse(false);
              setExtractFinished(false);
              setSum(null);
              if (e.target.files.length > 0) {
                invoiceData = Array.apply(null, Array(e.target.files.length));
                sumString = "";
                setFiles(Array.from(e.target.files));
              }
            }} />
          </label>
        </div>
        <button type="button" className="text-white bg-blue-700 hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300 font-medium rounded-full text-sm px-5 py-2.5 text-center mr-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800" onClick={() => startParse(true)}>Extract Invoice Data</button>
        <button type="button" className="text-white bg-blue-700 hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300 font-medium rounded-full text-sm px-5 py-2.5 text-center mr-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800 disabled:opacity-25" onClick={exportToExcel} disabled={!extractFinished && !sum}>Export To Excel</button>
      </div>
      <div className="flex">
        <div className="w-1/4" />
        <div className='w-3/4 h-full ml-11'>
          {files && files.length > 0 &&
            (<>
              <div className="invoice">
                {/* <thead>
                <tr>
                  <td>ID</td>
                  <td>Provider Name</td>
                  <td>CIF</td>
                  <td>Invoice Date</td>
                  <td>Invoice Number</td>
                  <td>Tax(%)</td>
                  <td>Base Amount</td>
                  <td>Tax Amount</td>
                  <td>Total</td>
                </tr>
              </thead> */}
                <ul>
                  <li>
                    <div className="bg-white dark:bg-gray-800 dark:border-gray-700 border border-gray-200 rounded-lg shadow my-2 px-4 py-4 flex items-center h-[3rem]">
                      <p className="w-1/12 text-left ml-4">No</p>
                      <p className="w-4/12">Provider<br />Name</p>
                      <p className="w-2/12">CIF</p>
                      <p className="w-2/12">Invoice<br />Date</p>
                      <p className="w-2/12">Invoice<br />Number</p>
                      <p className="w-2/12">Tax<br />Rate</p>
                      <p className="w-2/12">Base<br />Amount</p>
                      <p className="w-2/12">Tax</p>
                      <p className="w-2/12">Total<br />Amount</p>
                    </div>
                  </li>
                  {
                    files.map((file, index) => {
                      return (
                        <li key={`invoice-${file.name}`}>
                          <InvoiceRow file={file} index={index} key={`invoice-${index}`} parse={parse} onInvoiceDataExtracted={onInvoiceDataExtracted} />
                        </li>
                      )
                    })
                  }
                  {
                    sum && <li><SumRow data={sum}/></li>
                  }
                </ul>
              </div>
            </>)

          }
        </div>
      </div>
    </div>
  );
}

export default App;
