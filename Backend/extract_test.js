const mammoth = require("mammoth");
const fs = require("fs");

mammoth.extractRawText({path: "D:\\TalentVerse AI\\DOCX\\CV of George Eichbaum (5).docx"})
    .then(function(result){
        const text = result.value.toLowerCase();
        
        const jobs = ["caulfield", "nk groundworks", "ferrovial"];
        jobs.forEach(job => {
            const idx = text.indexOf(job);
            if (idx !== -1) {
                console.log(`[FOUND] ${job} is present in the new DOCX!`);
            } else {
                console.log(`[MISSING] ${job} was NOT found.`);
            }
        });
    })
    .catch(function(error) {
        console.error(error);
    });
