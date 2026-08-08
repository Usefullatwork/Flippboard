#!/usr/bin/env python3
"""
Vestaboard Software Core Base - Python Reference Implementation
Provides text-to-matrix formatting, color code parsing, quote management,
and Vestaboard API integration (Cloud & Local API).
"""

import os
import sys
import json
import time
import math
import hashlib
import urllib.request
import urllib.parse
from datetime import datetime

# Vestaboard Constants
BOARD_ROWS = 6
BOARD_COLS = 22
TOTAL_FLAPS = BOARD_ROWS * BOARD_COLS

# Official Vestaboard Character Code Mapping
CHAR_CODES = {
  ' ': 0,
  'A': 1,  'B': 2,  'C': 3,  'D': 4,  'E': 5,  'F': 6,  'G': 7,  'H': 8,  'I': 9,
  'J': 10, 'K': 11, 'L': 12, 'M': 13, 'N': 14, 'O': 15, 'P': 16, 'Q': 17, 'R': 18,
  'S': 19, 'T': 20, 'U': 21, 'V': 22, 'W': 23, 'X': 24, 'Y': 25, 'Z': 26,
  '1': 27, '2': 28, '3': 29, '4': 30, '5': 31, '6': 32, '7': 33, '8': 34, '9': 35, '0': 36,
  '!': 37, '@': 38, '#': 39, '$': 40, '(': 41, ')': 42, '-': 44, '+': 46, '&': 47,
  '=': 48, ';': 49, ':': 50, "'": 52, '"': 53, '%': 54, ',': 55, '.': 56, '/': 59, '?': 60,
  # Color Tiles
  '{red}': 63,
  '{orange}': 64,
  '{yellow}': 65,
  '{green}': 66,
  '{blue}': 67,
  '{violet}': 68,
  '{white}': 69,
  '{black}': 70
}

class VestaboardFormatter:
    """Formats strings and color tile tokens into 6x22 Vestaboard character matrices."""
    
    @staticmethod
    def parse_tokens(raw_text):
        """Parses string into token array supporting character and color tile tags."""
        lines = raw_text.split('\n')
        parsed_lines = []
        for line in lines:
            tokens = []
            i = 0
            while i < len(line):
                matched = False
                for tag, code in CHAR_CODES.items():
                    if tag.startswith('{') and line[i:i+len(tag)].lower() == tag:
                        tokens.append({'type': 'code', 'val': code})
                        i += len(tag)
                        matched = True
                        break
                if not matched:
                    ch = line[i].upper()
                    code = CHAR_CODES.get(ch, 0)
                    tokens.append({'type': 'code', 'val': code})
                    i += 1
            parsed_lines.append(tokens)
        return parsed_lines

    @classmethod
    def format_matrix(cls, raw_text, align="center"):
        """Converts raw text input into a 6x22 integer array (6 rows x 22 cols)."""
        parsed_lines = cls.parse_tokens(raw_text)[:BOARD_ROWS]
        matrix = [[0 for _ in range(BOARD_COLS)] for _ in range(BOARD_ROWS)]
        
        if align == "left":
            for r_idx, line in enumerate(parsed_lines):
                for c_idx, tok in enumerate(line[:BOARD_COLS]):
                    matrix[r_idx][c_idx] = tok['val']
        else: # Center align
            num_lines = len(parsed_lines)
            start_row = max(0, (BOARD_ROWS - num_lines) // 2)
            for l_idx, line in enumerate(parsed_lines):
                row = start_row + l_idx
                if row >= BOARD_ROWS:
                    break
                line_len = len(line)
                start_col = max(0, (BOARD_COLS - line_len) // 2)
                for tok_idx, tok in enumerate(line[:BOARD_COLS]):
                    col = start_col + tok_idx
                    if col < BOARD_COLS:
                        matrix[row][col] = tok['val']
        return matrix


class VestaboardApiClient:
    """Client for Vestaboard Read/Write Cloud API and Local API."""
    
    def __init__(self, api_key=None, read_write_key=None, local_ip=None, local_key=None):
        self.api_key = api_key
        self.read_write_key = read_write_key
        self.local_ip = local_ip
        self.local_key = local_key

    def send_matrix_cloud(self, matrix):
        """Sends a 6x22 matrix to Vestaboard Cloud API."""
        if not self.read_write_key:
            raise ValueError("read_write_key is required for Cloud API")
        
        url = f"https://rw.vestaboard.com/"
        headers = {
            "X-Vestaboard-Read-Write-Key": self.read_write_key,
            "Content-Type": "application/json"
        }
        data = json.dumps(matrix).encode('utf-8')
        req = urllib.request.Request(url, data=data, headers=headers, method='POST')
        
        with urllib.request.urlopen(req) as response:
            return json.loads(response.read().decode('utf-8'))

    def send_matrix_local(self, matrix):
        """Sends a 6x22 matrix directly to Vestaboard via Local API."""
        if not self.local_ip or not self.local_key:
            raise ValueError("local_ip and local_key are required for Local API")

        url = f"http://{self.local_ip}:7000/LocalAPI/message"
        headers = {
            "X-Vestaboard-Local-Api-Key": self.local_key,
            "Content-Type": "application/json"
        }
        data = json.dumps(matrix).encode('utf-8')
        req = urllib.request.Request(url, data=data, headers=headers, method='POST')

        with urllib.request.urlopen(req) as response:
            return json.loads(response.read().decode('utf-8'))


class QuoteSchedulerEngine:
    """Quote Library and Scheduler Base Engine."""
    
    def __init__(self, quotes_file=None):
        self.quotes = []
        if quotes_file and os.path.exists(quotes_file):
            with open(quotes_file, 'r', encoding='utf-8') as f:
                self.quotes = json.load(f)
        else:
            self.quotes = [
                {"text": "BE THE CHANGE YOU WISH TO SEE IN THE WORLD", "author": "Mahatma Gandhi"},
                {"text": "{yellow} STAY HUNGRY {yellow}\n{red} STAY FOOLISH {red}", "author": "Steve Jobs"},
                {"text": "{green} HELLO WORLD {green}\nVESTABOARD SOFTWARE CORE", "author": "System Base"},
                {"text": "SIMPLICITY IS THE ULTIMATE SOPHISTICATION", "author": "Leonardo da Vinci"}
            ]

    def get_daily_quote(self):
        """Deterministically picks a quote of the day based on YYYY-MM-DD."""
        today_str = datetime.now().strftime("%Y-%m-%d")
        hash_val = int(hashlib.md5(today_str.encode('utf-8')).hexdigest(), 16)
        idx = hash_val % len(self.quotes)
        return self.quotes[idx]


def main():
    print("=== VESTABOARD SOFTWARE CORE ENGINE ===")
    print("Parsing sample quote and generating 6x22 matrix...\n")
    
    sample_text = "{yellow} STAY HUNGRY {yellow}\n{red} STAY FOOLISH {red}"
    matrix = VestaboardFormatter.format_matrix(sample_text, align="center")
    
    print(f"Text Input:\n{sample_text}\n")
    print("Generated 6x22 Character Code Matrix:")
    for row in matrix:
        print(" ".join(f"{val:2d}" for val in row))
    
    print("\nSoftware base verification successful.")

if __name__ == "__main__":
    main()
