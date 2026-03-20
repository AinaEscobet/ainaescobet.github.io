let pyodideReady = (async () => {

    const pyodide = await loadPyodide();

    pyodide.setStdout({
        batched: (data) => console.log(data)
    });

    pyodide.setStderr({
        batched: (data) => console.error(data)
    });

    await pyodide.loadPackage("micropip");

    await pyodide.runPythonAsync(`
        import micropip
        await micropip.install("biopython")
        await micropip.install("https://ainaescobet.github.io/wa_entrez/wa_entrez-1.0.0-py3-none-any.whl")
    `);

    console.log("Packages installed")

    await pyodide.runPythonAsync(`
        from wa_entrez import WAEntrezClient
        print("WAEntrezClient imported successfully")
    `);

    console.log("Pyodide ready");
    return pyodide;
})();

let lastResultFile = null;
async function runPubMedApp() {
    const pyodide = await pyodideReady;
    const pmid = document.getElementById("pmid").value;
    

    // Create a config object
    const config = {
        pmid: pmid
    }
    // Write config object to a file in the Pyodide filesystem (FS)
    pyodide.FS.writeFile("config.json", JSON.stringify(config));

    // Load Python code 
    const response = await fetch("python_pipeline.py");
    const pythonCode = await response.text();

    await pyodide.runPythonAsync(pythonCode);

    // Execute the pipline
    const resultPy =  await pyodide.runPythonAsync(`fetch_pubmed()`);
    const result = resultPy.toJs();
    lastResultFile = result.file;
    console.log(result);


    const outputDiv = document.getElementById("pubmed-output");

    outputDiv.innerHTML = `
        <p><strong>Title:</strong> ${result.title}</p>
        <p><strong>Journal:</strong> ${result.journal}</p>
        <p><strong>Authors:</strong> ${result.authors}</p>
    `;

    outputDiv.parentElement.style.display = "block";
    document.getElementById("download-btn-pubmed").disabled = false;

}

async function runGenomicsApp() {
    const pyodide = await pyodideReady;
    const genome = document.getElementById("genome").value;
    const config = {
        genome: genome
    }
    

    pyodide.FS.writeFile("config.json", JSON.stringify(config));

    const response = await fetch("python_pipeline.py");
    const pythonCode = await response.text();
    await pyodide.runPythonAsync(pythonCode);

    const resultPy =  await pyodide.runPythonAsync(`fetch_genomics()`);
    const result = resultPy.toJs();
    lastResultFile = result.file;
    console.log(result);

    const outputDiv = document.getElementById("genomics-output");
    outputDiv.innerHTML = `
        <p><strong>Genome ID:</strong> ${result.id}</p>
        <p><strong>Name:</strong> ${result.name}</p>
        <p><strong>Description:</strong> ${result.description}</p>
        <p><strong>Sequence Length:</strong> ${result.sequence_length}</p>
        <p><strong>Organism:</strong> ${result.organism}</p>

    `;

    outputDiv.parentElement.style.display = "block";
    document.getElementById("download-btn-genomics").disabled = false;

}
async function download(){
    const pyodide = await pyodideReady;

    if (!lastResultFile) {
        alert("No results to download");
        return;
    }

    const content = pyodide.FS.readFile(lastResultFile, {encoding: "utf8"});

    const blob = new Blob([content], {type: "text/plain"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "result.txt";
    a.click();
    URL.revokeObjectURL(url);
}
// NZ_JBQPCT010000034.1