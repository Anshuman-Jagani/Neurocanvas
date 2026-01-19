#!/usr/bin/env python3
"""
NeuroCanvas Python ML Scripts Test Suite
Tests all Python ML scripts for import errors and basic functionality
"""

import sys
import subprocess
import json

def test_module_import(module_path, module_name):
    """Test if a Python module can be imported"""
    print(f"\n{'='*60}")
    print(f"Testing: {module_name}")
    print(f"Path: {module_path}")
    print(f"{'='*60}")
    
    try:
        result = subprocess.run(
            ['python3', '-c', f'import {module_path}; print("✓ Module loads successfully")'],
            capture_output=True,
            text=True,
            timeout=5
        )
        
        if result.returncode == 0:
            print(f"✓ PASS: {module_name}")
            print(result.stdout)
            return True
        else:
            print(f"✗ FAIL: {module_name}")
            print("Error:", result.stderr)
            return False
    except subprocess.TimeoutExpired:
        print(f"✗ TIMEOUT: {module_name}")
        return False
    except Exception as e:
        print(f"✗ ERROR: {module_name}")
        print(str(e))
        return False

def test_script_help(script_path, script_name):
    """Test if a Python script can show help"""
    print(f"\n{'='*60}")
    print(f"Testing: {script_name} --help")
    print(f"Path: {script_path}")
    print(f"{'='*60}")
    
    try:
        result = subprocess.run(
            ['python3', script_path, '--help'],
            capture_output=True,
            text=True,
            timeout=5
        )
        
        if result.returncode == 0:
            print(f"✓ PASS: {script_name}")
            print(result.stdout[:200])  # First 200 chars
            return True
        else:
            print(f"✗ FAIL: {script_name}")
            print("Error:", result.stderr[:500])
            return False
    except subprocess.TimeoutExpired:
        print(f"✗ TIMEOUT: {script_name}")
        return False
    except Exception as e:
        print(f"✗ ERROR: {script_name}")
        print(str(e))
        return False

def test_nlp_analyze():
    """Test NLP prompt analyzer"""
    print(f"\n{'='*60}")
    print("Testing: NLP Prompt Analyzer")
    print(f"{'='*60}")
    
    test_input = {
        "action": "analyze",
        "prompt": "A beautiful sunset over mountains"
    }
    
    try:
        result = subprocess.run(
            ['python3', 'ml/nlp/prompt_analyzer.py'],
            input=json.dumps(test_input),
            capture_output=True,
            text=True,
            timeout=10
        )
        
        if result.returncode == 0:
            print("✓ PASS: NLP Analyzer")
            output = json.loads(result.stdout)
            print(f"Keywords found: {len(output.get('keywords', []))}")
            return True
        else:
            print("✗ FAIL: NLP Analyzer")
            print("Error:", result.stderr[:500])
            return False
    except Exception as e:
        print(f"✗ ERROR: NLP Analyzer - {str(e)}")
        return False

def main():
    print("="*60)
    print("NeuroCanvas Python ML Scripts Test Suite")
    print("="*60)
    
    results = {
        'passed': 0,
        'failed': 0,
        'tests': []
    }
    
    # Test NLP modules
    print("\n\n### NLP MODULES ###")
    tests = [
        ('ml/nlp/prompt_analyzer', 'NLP Prompt Analyzer'),
        ('ml/nlp/prompt_enhancer', 'NLP Prompt Enhancer'),
        ('ml/nlp/keyword_extractor', 'NLP Keyword Extractor'),
        ('ml/nlp/sentiment_analyzer', 'NLP Sentiment Analyzer'),
    ]
    
    for module_path, name in tests:
        # Convert path to module notation
        module_import = module_path.replace('/', '.')
        passed = test_module_import(module_import, name)
        results['tests'].append({'name': name, 'passed': passed})
        if passed:
            results['passed'] += 1
        else:
            results['failed'] += 1
    
    # Test Diffusion modules
    print("\n\n### DIFFUSION MODULES ###")
    tests = [
        ('ml/diffusion/stable_diffusion', 'Stable Diffusion'),
        ('ml/diffusion/mock_diffusion', 'Mock Diffusion'),
        ('ml/diffusion/prompt_utils', 'Prompt Utils'),
    ]
    
    for module_path, name in tests:
        module_import = module_path.replace('/', '.')
        passed = test_module_import(module_import, name)
        results['tests'].append({'name': name, 'passed': passed})
        if passed:
            results['passed'] += 1
        else:
            results['failed'] += 1
    
    # Test Style Transfer modules
    print("\n\n### STYLE TRANSFER MODULES ###")
    tests = [
        ('ml/style_transfer/neural_style_transfer', 'Neural Style Transfer'),
    ]
    
    for module_path, name in tests:
        module_import = module_path.replace('/', '.')
        passed = test_module_import(module_import, name)
        results['tests'].append({'name': name, 'passed': passed})
        if passed:
            results['passed'] += 1
        else:
            results['failed'] += 1
    
    # Test LLM modules
    print("\n\n### LLM MODULES ###")
    tests = [
        ('ml/llm/llm_service', 'LLM Service'),
        ('ml/llm/art_director', 'Art Director'),
        ('ml/llm/conversation_manager', 'Conversation Manager'),
    ]
    
    for module_path, name in tests:
        module_import = module_path.replace('/', '.')
        passed = test_module_import(module_import, name)
        results['tests'].append({'name': name, 'passed': passed})
        if passed:
            results['passed'] += 1
        else:
            results['failed'] += 1
    
    # Test functional NLP
    print("\n\n### FUNCTIONAL TESTS ###")
    passed = test_nlp_analyze()
    results['tests'].append({'name': 'NLP Functional Test', 'passed': passed})
    if passed:
        results['passed'] += 1
    else:
        results['failed'] += 1
    
    # Summary
    print("\n\n" + "="*60)
    print("TEST SUMMARY")
    print("="*60)
    print(f"✓ Passed: {results['passed']}")
    print(f"✗ Failed: {results['failed']}")
    print(f"Total: {results['passed'] + results['failed']}")
    print("="*60)
    
    if results['failed'] == 0:
        print("\n✓ All tests passed!")
        sys.exit(0)
    else:
        print(f"\n✗ {results['failed']} tests failed!")
        sys.exit(1)

if __name__ == '__main__':
    main()
