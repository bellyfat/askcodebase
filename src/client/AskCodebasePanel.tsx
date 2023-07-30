import styles from './AskCodebasePanel.module.scss'
import { MonacoInputBox, WelcomeScreen } from '~/client/components'
import { useEffect, useState } from 'react'
import { VSCodeApi } from './VSCodeApi'
import { colorToRGBString } from '~/client/utils'
import { CommandBlocks } from './components/CommandBlocks'
import { useAtomValue } from 'jotai'
import { commandBlocksAtom } from './store'
import { useCommandBlocks } from './hooks'
import { ReactStreamChat } from './components/ReactStreamChat'
import { Message } from './types/chat'
import { ChatInputComponent } from './components/Chat/Chat'

function getThemeColors() {
  const element = document.getElementsByTagName('html')[0]
  const colors = Object.values(element.style).map(color => {
    const colorValue = element.style.getPropertyValue(color)
    return [color, colorValue]
  })
  return colors
    .filter(([key, value]) => key.startsWith('--'))
    .reduce((o, [key, value]) => Object.assign(o, { [key]: value }), {})
}

export function AskCodebasePanel() {
  const [themeColors, setThemeColors] = useState<Record<string, string>>(() => getThemeColors())
  const blocks = useAtomValue(commandBlocksAtom)

  useCommandBlocks()

  useEffect(() => {
    VSCodeApi.onColorThemeChanged(() => setThemeColors(getThemeColors()))
  }, [])

  const colors = {
    '--vscode-terminal-ansiRedRGB': colorToRGBString(themeColors['--vscode-terminal-ansiRed']),
    '--vscode-terminal-ansiGreenRGB': colorToRGBString(themeColors['--vscode-terminal-ansiGreen']),
    '--vscode-terminal-ansiYellowRGB': colorToRGBString(
      themeColors['--vscode-terminal-ansiYellow']
    ),
    '--vscode-terminal-ansiBlueRGB': colorToRGBString(themeColors['--vscode-terminal-ansiBlue']),
    '--vscode-terminal-ansiMagentaRGB': colorToRGBString(
      themeColors['--vscode-terminal-ansiMagenta']
    ),
    '--vscode-terminal-ansiCyanRGB': colorToRGBString(themeColors['--vscode-terminal-ansiCyan']),
    '--vscode-terminal-ansiWhiteRGB': colorToRGBString(themeColors['--vscode-terminal-ansiWhite']),
    '--vscode-terminal-ansiBlackRGB': colorToRGBString(themeColors['--vscode-terminal-ansiBlack']),
    '--vscode-terminal-ansiBrightRedRGB': colorToRGBString(
      themeColors['--vscode-terminal-ansiBrightRed']
    ),
    '--vscode-terminal-ansiBrightGreenRGB': colorToRGBString(
      themeColors['--vscode-terminal-ansiBrightGreen']
    ),
    '--vscode-terminal-ansiBrightYellowRGB': colorToRGBString(
      themeColors['--vscode-terminal-ansiBrightYellow']
    ),
    '--vscode-terminal-ansiBrightBlueRGB': colorToRGBString(
      themeColors['--vscode-terminal-ansiBrightBlue']
    ),
    '--vscode-terminal-ansiBrightMagentaRGB': colorToRGBString(
      themeColors['--vscode-terminal-ansiBrightMagenta']
    ),
    '--vscode-terminal-ansiBrightCyanRGB': colorToRGBString(
      themeColors['--vscode-terminal-ansiBrightCyan']
    ),
    '--vscode-terminal-ansiBrightWhiteRGB': colorToRGBString(
      themeColors['--vscode-terminal-ansiBrightWhite']
    ),
    '--vscode-terminal-ansiBrightBlackRGB': colorToRGBString(
      themeColors['--vscode-terminal-ansiBrightBlack']
    )
  } as unknown as React.CSSProperties

  const getResponseStream = async (message: Message) => {
    if (Math.random() > 0.8) {
      throw new Error('Netowrk Timeout')
    }
    const encoder = new TextEncoder()
    const markdown = `
# QuickSort Algorithm in JavaScript

The QuickSort algorithm is a popular sorting algorithm, which is used to sort elements in an array. This divide-and-conquer algorithm works by selecting a 'pivot' element from the array and partitioning the other elements into two sub-arrays according to whether they are less than or greater than the pivot. The sub-arrays are then recursively sorted.

Below is a simple implementation of the QuickSort algorithm in JavaScript.

\`\`\`javascript
function quickSort(array, low = 0, high = array.length - 1) {
    if (low < high) {
        // Partition the array
        let pivotIndex = partition(array, low, high);

        // Sort the sub-arrays
        quickSort(array, low, pivotIndex);
        quickSort(array, pivotIndex + 1, high);
    }

    return array;
}

function partition(array, low, high) {
    let pivot = array[Math.floor((low + high) / 2)];
    let i = low - 1;
    let j = high + 1;

    while (true) {
        do {
            i++;
        } while (array[i] < pivot);

        do {
            j--;
        } while (array[j] > pivot);

        if (i >= j) {
            return j;
        }

        // Swap elements at indices i and j
        let temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
}

// Usage
let array = [10, 7, 8, 9, 1, 5];
let sortedArray = quickSort(array);
console.log(sortedArray); // Output: [1, 5, 7, 8, 9, 10]
\`\`\`

This implementation of QuickSort uses the Lomuto partition scheme, where we pick the pivot as the middle element of the array. 

QuickSort is an efficient, in-place sorting algorithm that, in practice, outperforms other sorting algorithms for large datasets, especially when the data is stored in a slow-to-access sequential medium like a hard disk. It has an average and worst-case time complexity of O(n log n).
`

    const uint8array = encoder.encode(markdown)
    let intervalId: NodeJS.Timeout
    return new ReadableStream({
      start(controller) {
        let i = 0
        const intervalId = setInterval(() => {
          if (i < uint8array.length) {
            controller.enqueue(uint8array.subarray(i, i + 5))
            i += 5
          } else {
            controller.close()
            clearInterval(intervalId)
          }
        }, 100)
      },
      pull(controller) {},
      cancel(reason) {
        clearInterval(intervalId)
      }
    })
  }
  const CustomChatInput: ChatInputComponent = ({
    stopConversationRef,
    textareaRef,
    onSend,
    onScrollDownClick,
    onRegenerate,
    showScrollDownButton
  }) => (
    <MonacoInputBox
      stopConversationRef={stopConversationRef}
      textareaRef={textareaRef}
      onSend={onSend}
      onScrollDownClick={onScrollDownClick}
      onRegenerate={onRegenerate}
      showScrollDownButton={showScrollDownButton}
    />
  )

  return (
    <div className={styles.AskCodebasePanel} style={colors}>
      <ReactStreamChat getResponseStream={getResponseStream} CustomChatInput={CustomChatInput} />
      {/* {blocks?.length > 0 ? <CommandBlocks blocks={blocks} /> : <WelcomeScreen />} */}
    </div>
  )
}
