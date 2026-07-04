package zapclient

import (
	"strconv"
)

func (c *Client) PassiveRecordsToScan() (int, error) {
	result, err := c.get("pscan/view/recordsToScan/", nil)
	if err != nil {
		return 0, err
	}
	count, _ := strconv.Atoi(stringFromAny(result["recordsToScan"]))
	return count, nil
}

func stringFromAny(v any) string {
	if v == nil {
		return "0"
	}
	switch val := v.(type) {
	case string:
		return val
	case float64:
		return strconv.Itoa(int(val))
	default:
		return "0"
	}
}
