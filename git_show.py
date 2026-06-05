import subprocess
import os

cwd = r"c:\Users\ASUS\.gemini\antigravity-ide\scratch\AI-Resume-Analyzer"
out_file = os.path.join(cwd, "git_show.txt")

with open(out_file, "w", encoding="utf-8") as f:
    res = subprocess.run(["git", "show", "HEAD"], cwd=cwd, capture_output=True, text=True, shell=True)
    f.write("STDOUT:\n")
    f.write(res.stdout + "\n")
    f.write("STDERR:\n")
    f.write(res.stderr + "\n")
