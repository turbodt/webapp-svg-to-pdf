import "@turbodt/personal-webpage-style/styles/main.css";
import "@turbodt/personal-webpage-style/styles/typography/main.css";
import "@turbodt/personal-webpage-style/styles/layout.css";
import "@turbodt/personal-webpage-style/styles/components/header.css";
import "@turbodt/personal-webpage-style/styles/components/footer.css";
import "@turbodt/personal-webpage-style/styles/components/pre.css";
import "@turbodt/personal-webpage-style/styles/forms/main.css";
import { createSvgToPdfConverter, PDF_SIZES } from "@turbodt/svg-to-pdf";
import type { PdfNamedSize, PdfSizeOptions, SvgToPdfOptions } from "@turbodt/svg-to-pdf";
import wasmUrl from "@turbodt/svg-to-pdf/svg-to-pdf.wasm?url";
import "./style.css";
import "./pwa";

const status = document.getElementById("status") as HTMLPreElement;
const fileInput = document.getElementById("file") as HTMLInputElement;
const fileName = document.getElementById("file-name") as HTMLElement;
const clearFileButton = document.getElementById("clear-file") as HTMLButtonElement;
const dropZone = document.getElementById("drop-zone") as HTMLElement;
const previewFrame = document.getElementById("preview-frame") as HTMLElement;
const svgPreview = document.getElementById("svg-preview") as HTMLImageElement;
const previewBackgroundInputs = document.querySelectorAll<HTMLInputElement>("input[name='preview-background']");
const widthInput = document.getElementById("container-width") as HTMLInputElement;
const heightInput = document.getElementById("container-height") as HTMLInputElement;
const pdfSizeInput = document.getElementById("pdf-size") as HTMLSelectElement;
const includeContainersInput = document.getElementById("include-containers") as HTMLInputElement;

let selectedFile: File | undefined;
let previewUrl: string | undefined;

const getFile = () => {
    if (!selectedFile) throw new Error("Choose an SVG file first.");
    return selectedFile;
};

const isSvgFile = (file: File) => file.type === "image/svg+xml" || file.name.toLowerCase().endsWith(".svg");

const setPreviewBackground = (value: string) => {
    previewFrame.classList.toggle("preview-background-light", value === "light");
    previewFrame.classList.toggle("preview-background-dark", value === "dark");
};

const setSelectedFile = (file: File) => {
    if (!isSvgFile(file)) {
        status.textContent = "Choose an SVG file.";
        return;
    }

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    selectedFile = file;
    previewUrl = URL.createObjectURL(file);
    fileName.textContent = file.name;
    clearFileButton.hidden = false;
    svgPreview.src = previewUrl;
    dropZone.classList.add("has-preview");
    status.textContent = `Loaded ${file.name}.`;
};

const clearSelectedFile = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    selectedFile = undefined;
    previewUrl = undefined;
    fileInput.value = "";
    fileName.textContent = "No SVG loaded";
    clearFileButton.hidden = true;
    svgPreview.removeAttribute("src");
    dropZone.classList.remove("has-preview");
    status.textContent = "Ready.";
};

function getPdfSizeOptions(): PdfSizeOptions {

    const widthInputValue = Number(widthInput.value);
    const heightInputValue = Number(heightInput.value);

    if (!pdfSizeInput.value && !!widthInputValue && !!heightInputValue) {
        return {
            pdfWidth: widthInputValue,
            pdfHeight: heightInputValue,
        };
    }

    const pdfSizeInputValue: string = !!pdfSizeInput.value
        ? pdfSizeInput.value as string
        : "a4-portrait"
    ;

    if (pdfSizeInputValue in PDF_SIZES) {
        return {
            "pdfSize": pdfSizeInputValue as PdfNamedSize
        };
    }

    switch (pdfSizeInputValue) {
        case "slides-4:3":
        return {
            pdfWidth: 720,
            pdfHeight: 540,
        };
        case "slides-16:9":
        return {
            pdfWidth: 960,
            pdfHeight: 540,
        };
    }

    throw new Error("Invalid PDF size type.");
}

const getOptions = (): SvgToPdfOptions => {
    return {
        containerWidth: Number(widthInput.value),
        containerHeight: Number(heightInput.value),
        includeContainers: includeContainersInput.checked,
        ...getPdfSizeOptions(),
    };
};

const download = (bytes: Uint8Array, filename: string, type: string) => {
    const blob = new Blob([new Uint8Array(bytes).buffer], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
};

async function main() {
    const converter = await createSvgToPdfConverter({ wasmUrl });
    status.textContent = "Ready.";

    setPreviewBackground(
        document.querySelector<HTMLInputElement>(
            "input[name='preview-background']:checked"
        )?.value ?? 'light'
    );

    previewBackgroundInputs.forEach(input => {
        input.addEventListener("change", () => {
            if (input.checked) setPreviewBackground(input.value);
        });
    });

    fileInput.addEventListener("change", () => {
        const file = fileInput.files?.[0];
        if (file) setSelectedFile(file);
    });

    clearFileButton.addEventListener("click", clearSelectedFile);

    dropZone.addEventListener("dragover", event => {
        event.preventDefault();
    });

    dropZone.addEventListener("drop", event => {
        event.preventDefault();
        const file = event.dataTransfer?.files[0];
        if (file) setSelectedFile(file);
    });

    document.getElementById("to-pdf")?.addEventListener("click", async () => {
        try {
            console.log(getOptions());
            throw new Error("");
            const file = getFile();
            status.textContent = "Converting to PDF...";
            const pdf = await converter.convertToPdf(file, getOptions());
            download(pdf, file.name.replace(/\.svg$/i, ".pdf"), "application/pdf");
            status.textContent = `PDF ready: ${pdf.length.toLocaleString()} bytes.`;
        } catch (err) {
            status.textContent = String(err);
        }
    });

    document.getElementById("first-svg")?.addEventListener("click", async () => {
        try {
            const file = getFile();
            status.textContent = "Extracting page 1...";
            const page = await converter.convertPageToSvg(file, 1, getOptions());
            download(page, file.name.replace(/\.svg$/i, "-page-1.svg"), "image/svg+xml");
            status.textContent = `Page 1 SVG ready: ${page.length.toLocaleString()} bytes.`;
        } catch (err) {
            status.textContent = String(err);
        }
    });

    document.getElementById("all-svg")?.addEventListener("click", async () => {
        try {
            const file = getFile();
            status.textContent = "Extracting all pages...";
            const pages = await converter.convertPagesToSvg(file, getOptions());
            pages.forEach((page, index) => {
                download(page, file.name.replace(/\.svg$/i, `-page-${index + 1}.svg`), "image/svg+xml");
            });
            status.textContent = `Extracted ${pages.length} SVG page(s).`;
        } catch (err) {
            status.textContent = String(err);
        }
    });
}

main().catch(err => {
    status.textContent = String(err);
});
