"""
read_ppt.py - Extract and display slide content from the Capstone Project PPT file.

Usage:
    python read_ppt.py

Requirements:
    pip install olefile
"""

import struct
import sys


def extract_text_from_ppt(ppt_path):
    """Extract all text content from a legacy .ppt file using olefile."""
    try:
        import olefile
    except ImportError:
        print("ERROR: olefile is not installed. Run: pip install olefile")
        sys.exit(1)

    if not olefile.isOleFile(ppt_path):
        print(f"ERROR: '{ppt_path}' is not a valid OLE/PPT file.")
        sys.exit(1)

    ole = olefile.OleFileIO(ppt_path)
    if not ole.exists('PowerPoint Document'):
        print("ERROR: 'PowerPoint Document' stream not found in the file.")
        sys.exit(1)

    data = ole.openstream('PowerPoint Document').read()
    ole.close()

    slides = []
    current_slide_texts = []
    i = 0

    # PowerPoint binary record type constants
    # Reference: [MS-PPT] §2.2 Record Enumeration
    # https://learn.microsoft.com/en-us/openspecs/office_file_formats/ms-ppt
    SLIDE_CONTAINER = 0x03E8   # SlideContainer — marks the start of each slide
    TEXT_CHARS_ATOM = 0x0FA0   # TextCharsAtom — slide text encoded as UTF-16-LE
    TEXT_BYTES_ATOM = 0x0FA8   # TextBytesAtom — slide text encoded as Latin-1

    while i < len(data) - 8:
        rec_ver_inst = struct.unpack_from('<H', data, i)[0]
        rec_type = struct.unpack_from('<H', data, i + 2)[0]
        rec_len = struct.unpack_from('<I', data, i + 4)[0]

        # Detect start of a new slide container
        if rec_type == SLIDE_CONTAINER:
            if current_slide_texts:
                slides.append(current_slide_texts)
            current_slide_texts = []

        elif rec_type == TEXT_CHARS_ATOM and rec_len > 0:
            end = i + 8 + rec_len
            if end <= len(data):
                raw = data[i + 8:end]
                text = raw.decode('utf-16-le', errors='replace').strip()
                if text:
                    current_slide_texts.append(text)

        elif rec_type == TEXT_BYTES_ATOM and rec_len > 0:
            end = i + 8 + rec_len
            if end <= len(data):
                raw = data[i + 8:end]
                text = raw.decode('latin-1', errors='replace').strip()
                if text:
                    current_slide_texts.append(text)

        # Advance: container records have no body (just child records), atoms advance by 8+len
        # In the PPT binary format the lower 4 bits of the version/instance
        # field (recVerAndInstance) hold the record version.  A value of 0xF
        # signals a container record (which holds child records but no body
        # data of its own); any other value indicates a leaf/atom record.
        if rec_ver_inst & 0x000F == 0x000F:
            # Container record — advance past the header only
            i += 8
        else:
            # Atom record — advance past header + body
            i += 8 + rec_len if rec_len > 0 else 8

    if current_slide_texts:
        slides.append(current_slide_texts)

    return slides


def normalize(text):
    """Replace PowerPoint paragraph separators with newlines."""
    return text.replace('\r', '\n').replace('\x0b', '\n')


def print_slides(slides):
    """Pretty-print all slide content."""
    slide_num = 0
    for texts in slides:
        # Skip master/template slides that contain only boilerplate
        cleaned = [t for t in texts
                   if not t.startswith('Click to edit') and t.strip('*').strip()]
        if not cleaned:
            continue

        slide_num += 1
        print(f"{'=' * 60}")
        print(f"  SLIDE {slide_num}")
        print(f"{'=' * 60}")
        for text in cleaned:
            for line in normalize(text).splitlines():
                line = line.strip()
                if line and line != '*':
                    print(f"  {line}")
        print()


def main():
    # The filename contains an en-dash (\u2013) as it appears in the repository.
    ppt_path = 'CSSE_Capstone-Project \u2013 Final_Review-2-PPT_2025-26.ppt'

    print(f"Reading: {ppt_path}\n")
    slides = extract_text_from_ppt(ppt_path)
    print_slides(slides)
    print(f"Total slides with content: {sum(1 for s in slides if any(t for t in s if not t.startswith('Click to edit') and t.strip('*').strip()))}")


if __name__ == '__main__':
    main()
